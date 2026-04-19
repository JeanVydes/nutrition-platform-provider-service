import type { FastifyInstance } from "fastify";

import { FindAllProvidersUseCase } from "@/core/application/use-cases/providers/find-all-providers.use-case.js";
import { FindProviderByAccountIdUseCase } from "@/core/application/use-cases/providers/find-provider-by-account-id.use-case.js";
import { DeleteProviderUseCase } from "@/core/application/use-cases/providers/delete-provider.use-case.js";
import { RegisterProviderUseCase } from "@/core/application/use-cases/providers/register-provider.use-case.js";
import { UpdateProviderUseCase } from "@/core/application/use-cases/providers/update-provider.use-case.js";
import { ProviderDrizzleRepository } from "@/modules/providers/infrastructure/drizzle/repositories/provider.drizzle.repository.js";
import { ProviderController } from "@/modules/providers/infrastructure/http/controllers/provider.controller.js";

export async function providerRoutes(app: FastifyInstance): Promise<void> {
    const providerRepository = new ProviderDrizzleRepository();
    const registerProviderUseCase = new RegisterProviderUseCase(providerRepository);
    const findAllProvidersUseCase = new FindAllProvidersUseCase(providerRepository);
    const findProviderByAccountIdUseCase = new FindProviderByAccountIdUseCase(providerRepository);
    const updateProviderUseCase = new UpdateProviderUseCase(providerRepository);
    const deleteProviderUseCase = new DeleteProviderUseCase(providerRepository);
    const providerController = new ProviderController(
        registerProviderUseCase,
        findAllProvidersUseCase,
        findProviderByAccountIdUseCase,
        updateProviderUseCase,
        deleteProviderUseCase,
    );

    app.post("/providers", providerController.registerProvider.bind(providerController));
    app.get("/providers", providerController.findAllProviders.bind(providerController));
    app.get("/providers/account/:accountId", providerController.findProviderByAccountId.bind(providerController));
    app.patch("/providers/:id", providerController.updateProvider.bind(providerController));
    app.delete("/providers/:id", providerController.deleteProvider.bind(providerController));
}
