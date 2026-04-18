import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { providerRoutes } from "@/modules/providers/infrastructure/http/routes/provider.routes.js";
import { cafeteriaRoutes } from "@/modules/cafeterias/infrastructure/http/routes/cafeteria.routes.js";
import { workerRoutes } from "@/modules/workers/infrastructure/http/routes/worker.routes.js";

type AuthContext = {
    accountId: string;
    roles: string[];
    scopes: string[];
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

async function introspectToken(
    securityServiceUrl: string,
    introspectionPath: string,
    token: string
): Promise<AuthContext | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch(`${securityServiceUrl}${introspectionPath}`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ token }),
            signal: controller.signal,
        });

        if (!response.ok) return null;

        const payload = (await response.json()) as {
            active?: boolean;
            valid?: boolean;
            sub?: string;
            accountId?: string;
            userId?: string;
            roles?: string[];
            scopes?: string[];
        };

        const isActive = payload.active ?? payload.valid ?? true;
        const accountId = payload.sub ?? payload.accountId ?? payload.userId ?? "";

        if (!isActive || !accountId) return null;

        return {
            accountId,
            roles: payload.roles ?? [],
            scopes: payload.scopes ?? [],
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export async function createApp(): Promise<FastifyInstance> {
    const NODE_ENV = process.env.NODE_ENV || "development";
    const OFFLINE = (process.env.OFFLINE || "false").toLowerCase() === "true";
    const OFFLINE_ACCOUNT_ID = process.env.OFFLINE_ACCOUNT_ID || "mock-account-id";
    const OFFLINE_ROLES = process.env.OFFLINE_ROLES
        ? process.env.OFFLINE_ROLES.split(",").map((role) => role.trim()).filter(Boolean)
        : ["developer"];
    const OFFLINE_SCOPES = process.env.OFFLINE_SCOPES
        ? process.env.OFFLINE_SCOPES.split(",").map((scope) => scope.trim()).filter(Boolean)
        : ["*"];
    const SECURITY_SERVICE_URL = process.env.SECURITY_SERVICE_URL || "http://localhost:4000";
    const SECURITY_INTROSPECTION_PATH = process.env.SECURITY_INTROSPECTION_PATH || "/auth/introspect";
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

    if (OFFLINE) {
        app.log.warn("OFFLINE mode enabled: external security service introspection is bypassed");
    }

    app.addHook("onRequest", async (request, reply) => {
        const requestPath = getPathFromUrl(request.url);

        if (AUTH_BYPASS_PATHS.has(requestPath) || request.method === "OPTIONS") {
            return;
        }

        if (OFFLINE) {
            (request as AuthenticatedRequest).auth = {
                accountId: OFFLINE_ACCOUNT_ID,
                roles: OFFLINE_ROLES,
                scopes: OFFLINE_SCOPES,
            };
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
            SECURITY_INTROSPECTION_PATH,
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
