import type { FastifyInstance } from "fastify";

import { RegisterProviderUseCase } from "@/core/application/use-cases/providers/register-provider.use-case.js";
import { ProviderDrizzleRepository } from "@/modules/providers/infrastructure/drizzle/repositories/provider.drizzle.repository.js";
import { ProviderController } from "@/modules/providers/infrastructure/http/controllers/provider.controller.js";

export async function providerRoutes(app: FastifyInstance): Promise<void> {
    const providerRepository = new ProviderDrizzleRepository();
    const registerProviderUseCase = new RegisterProviderUseCase(providerRepository);
    const providerController = new ProviderController(registerProviderUseCase);

    app.post("/providers", providerController.registerProvider.bind(providerController));
}
