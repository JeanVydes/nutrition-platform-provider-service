import type { FastifyInstance } from "fastify";

import { FindAllCafeteriasUseCase } from "@/core/application/use-cases/cafeterias/find-all-cafeterias.use-case.js";
import { FindCafeteriaByIdUseCase } from "@/core/application/use-cases/cafeterias/find-cafeteria-by-id.use-case.js";
import { FindCafeteriasByProviderIdUseCase } from "@/core/application/use-cases/cafeterias/find-cafeterias-by-provider-id.use-case.js";
import { RegisterCafeteriaUseCase } from "@/core/application/use-cases/cafeterias/register-cafeteria.use-case.js";
import { ProviderDrizzleRepository } from "@/modules/providers/infrastructure/drizzle/repositories/provider.drizzle.repository.js";
import { CafeteriaDrizzleRepository } from "@/modules/cafeterias/infrastructure/drizzle/repositories/cafeteria.drizzle.repository.js";
import { CafeteriaController } from "@/modules/cafeterias/infrastructure/http/controllers/cafeteria.controller.js";

export async function cafeteriaRoutes(app: FastifyInstance): Promise<void> {
    const providerRepository = new ProviderDrizzleRepository();
    const cafeteriaRepository = new CafeteriaDrizzleRepository();

    const registerCafeteriaUseCase = new RegisterCafeteriaUseCase(cafeteriaRepository, providerRepository);
    const findAllCafeteriasUseCase = new FindAllCafeteriasUseCase(cafeteriaRepository);
    const findCafeteriaByIdUseCase = new FindCafeteriaByIdUseCase(cafeteriaRepository);
    const findCafeteriasByProviderIdUseCase = new FindCafeteriasByProviderIdUseCase(cafeteriaRepository);
    const cafeteriaController = new CafeteriaController(
        registerCafeteriaUseCase,
        findAllCafeteriasUseCase,
        findCafeteriaByIdUseCase,
        findCafeteriasByProviderIdUseCase,
    );

    app.post("/cafeterias", cafeteriaController.registerCafeteria.bind(cafeteriaController));
    app.get("/cafeterias", cafeteriaController.findAllCafeterias.bind(cafeteriaController));
    app.get("/cafeterias/provider/:providerId", cafeteriaController.findCafeteriasByProviderId.bind(cafeteriaController));
    app.get("/cafeterias/:id", cafeteriaController.findCafeteriaById.bind(cafeteriaController));
}
