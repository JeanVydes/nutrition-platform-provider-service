import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { providerRoutes } from "@/modules/providers/infrastructure/http/routes/provider.routes.js";
import { cafeteriaRoutes } from "@/modules/cafeterias/infrastructure/http/routes/cafeteria.routes.js";
import { workerRoutes } from "@/modules/workers/infrastructure/http/routes/worker.routes.js";
import { schoolConfigRoutes } from "@/modules/school-configs/infrastructure/http/routes/school-config.routes.js";

type AuthContext = {
    accountId: string;
    roles: string[];
    scopes: string[];
    accessToken: string;
};

type AuthenticatedRequest = FastifyRequest & {
    auth?: AuthContext;
};

function getPathFromUrl(url: string): string {
    return url.split("?")[0] || "/";
}

function parseOrigins(value: string | undefined): string[] {
    if (!value) return [];
    return value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

function decodeJwtPayload(token: string): {
    sub?: string;
    roles?: string[];
    scopes?: string[];
    uuidAcceso?: string;
} | null {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    try {
        return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    } catch {
        return null;
    }
}

async function introspectToken(
    securityServiceUrl: string,
    mePath: string,
    token: string
): Promise<AuthContext | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch(`${securityServiceUrl}${mePath}`, {
            method: "GET",
            headers: {
                authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
        });

        if (!response.ok) return null;

        const payload = decodeJwtPayload(token);
        if (!payload) return null;

        const accountId = payload.sub ?? payload.uuidAcceso ?? "";
        if (!accountId) return null;

        return {
            accountId,
            roles: payload.roles ?? [],
            scopes: payload.scopes ?? [],
            accessToken: token,
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export async function createApp(): Promise<FastifyInstance> {
    const NODE_ENV = process.env.NODE_ENV || "development";
    const SECURITY_SERVICE_URL = process.env.SECURITY_SERVICE_URL || "https://mriai.coreunimag.com/api/auth";
    const SECURITY_ME_PATH = process.env.SECURITY_ME_PATH || "/me";
    const AUTH_BYPASS_PATHS = new Set(["/health"]);

    const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);
    const allowAllOriginsInDev = NODE_ENV !== "production" && allowedOrigins.length === 0;

    const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 120);
    const RATE_LIMIT_TIME_WINDOW = process.env.RATE_LIMIT_TIME_WINDOW || "1 minute";

    const app = Fastify({
        logger: {
            level: NODE_ENV === "production" ? "info" : "debug",
            transport:
                NODE_ENV === "development"
                    ? {
                        target: "pino-pretty",
                        options: {
                            translateTime: "HH:MM:ss Z",
                            ignore: "pid,hostname",
                            colorize: true,
                        },
                    }
                    : undefined,
        },
    }).withTypeProvider<ZodTypeProvider>();

    // Error handler global
    app.setErrorHandler((err, _req, reply) => {
        const error = err as any;

        app.log.error(error);

        if (error.validation) {
            return reply.status(400).send({
                error: "Invalid request",
                message: "Validation error",
                details: error.validation,
            });
        }

        if (error.statusCode) {
            return reply.status(error.statusCode).send({
                error: error.name,
                message: error.message,
            });
        }

        return reply.status(500).send({
            error: "Internal server error",
            message: "An unexpected error occurred",
        });
    });

    // Plugins
    await app.register(cors, {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowAllOriginsInDev) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error("Origin not allowed by CORS"), false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"],
        maxAge: 86400,
    });

    await app.register(sensible);
    await app.register(providerRoutes);
    await app.register(cafeteriaRoutes);
    await app.register(workerRoutes);
    await app.register(schoolConfigRoutes);

    await app.register(rateLimit, {
        global: true,
        max: RATE_LIMIT_MAX,
        timeWindow: RATE_LIMIT_TIME_WINDOW,
        addHeaders: {
            "x-ratelimit-limit": true,
            "x-ratelimit-remaining": true,
            "x-ratelimit-reset": true,
            "retry-after": true,
        },
        errorResponseBuilder: (_request, context) => ({
            error: "Too many requests",
            message: `Rate limit exceeded, retry in ${context.after}`,
            statusCode: 429,
        }),
    });

    app.addHook("onRequest", async (request, reply) => {
        const requestPath = getPathFromUrl(request.url);

        if (AUTH_BYPASS_PATHS.has(requestPath) || request.method === "OPTIONS") {
            return;
        }

        const authorization = request.headers.authorization;

        if (!authorization?.startsWith("Bearer ")) {
            return reply.status(401).send({
                error: "Unauthorized",
                message: "Missing Bearer token",
            });
        }

        const token = authorization.slice("Bearer ".length).trim();
        if (!token) {
            return reply.status(401).send({
                error: "Unauthorized",
                message: "Invalid Bearer token",
            });
        }

        const auth = await introspectToken(
            SECURITY_SERVICE_URL,
            SECURITY_ME_PATH,
            token
        );

        if (!auth) {
            return reply.status(401).send({
                error: "Unauthorized",
                message: "Token rejected by security service",
            });
        }

        (request as AuthenticatedRequest).auth = auth;
    });

    // Health check
    app.get(
        "/health",
        {
            config: {
                rateLimit: false,
            },
        },
        async () => ({
            status: "ok",
            timestamp: new Date().toISOString(),
            service: "provider-service",
        })
    );

    // Not found
    app.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            error: "Not found",
            message: `Route ${request.method} ${request.url} not found`,
        });
    });

    return app;
}
