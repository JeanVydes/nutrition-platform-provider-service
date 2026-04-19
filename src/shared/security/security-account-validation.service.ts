import type { IAccountValidationService } from "@/core/domain/services/account-validation.service.js";

export class SecurityAccountValidationService implements IAccountValidationService {
    async ensureAccountExists(accountId: string): Promise<void> {
        const offline = (process.env.OFFLINE || "false").toLowerCase() === "true";
        if (offline) return;

        const securityServiceUrl = process.env.SECURITY_SERVICE_URL || "http://localhost:4000";
        const pathTemplate = process.env.SECURITY_ACCOUNT_CHECK_PATH_TEMPLATE || "/accounts/:accountId";
        const method = (process.env.SECURITY_ACCOUNT_CHECK_METHOD || "GET").toUpperCase();
        const serviceToken = process.env.SECURITY_SERVICE_TOKEN;

        const path = pathTemplate.replace(":accountId", encodeURIComponent(accountId));
        const url = `${securityServiceUrl}${path}`;

        const headers: Record<string, string> = {
            "content-type": "application/json",
        };

        if (serviceToken) {
            headers.authorization = `Bearer ${serviceToken}`;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: method === "POST" ? JSON.stringify({ accountId }) : undefined,
                signal: controller.signal,
            });

            if (response.status === 404) {
                throw new Error("Worker account not found in security service");
            }

            if (!response.ok) {
                throw new Error("Could not validate worker account with security service");
            }
        } catch (error) {
            if (error instanceof Error) {
                if (
                    error.message === "Worker account not found in security service" ||
                    error.message === "Could not validate worker account with security service"
                ) {
                    throw error;
                }
            }

            throw new Error("Could not validate worker account with security service");
        } finally {
            clearTimeout(timeout);
        }
    }
}
