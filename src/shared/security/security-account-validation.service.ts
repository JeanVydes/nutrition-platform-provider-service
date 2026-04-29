import type { IAccountValidationService } from "@/core/domain/services/account-validation.service.js";

export class SecurityAccountValidationService implements IAccountValidationService {
    async ensureAccountExists(accountId: string, accessToken?: string): Promise<void> {
        const securityServiceUrl = process.env.SECURITY_SERVICE_URL || "https://mriai.coreunimag.com/api/auth";
        const pathTemplate = process.env.SECURITY_ACCOUNT_CHECK_PATH_TEMPLATE || "/users/:id";
        const method = (process.env.SECURITY_ACCOUNT_CHECK_METHOD || "GET").toUpperCase();
        const serviceToken = process.env.SECURITY_SERVICE_TOKEN;

        const path = pathTemplate.replace(":id", encodeURIComponent(accountId)).replace(":accountId", encodeURIComponent(accountId));
        const url = `${securityServiceUrl}${path}`;

        const headers: Record<string, string> = {
            "content-type": "application/json",
        };

        const bearerToken = serviceToken || accessToken;
        if (bearerToken) {
            headers.authorization = `Bearer ${bearerToken}`;
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
                throw new Error("Account not found in security service");
            }

            if (!response.ok) {
                throw new Error("Could not validate account with security service");
            }
        } catch (error) {
            if (error instanceof Error) {
                if (
                    error.message === "Account not found in security service" ||
                    error.message === "Could not validate account with security service"
                ) {
                    throw error;
                }
            }

            throw new Error("Could not validate account with security service");
        } finally {
            clearTimeout(timeout);
        }
    }
}
