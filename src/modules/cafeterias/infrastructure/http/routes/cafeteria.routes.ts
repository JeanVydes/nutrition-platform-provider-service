import type { FastifyInstance } from "fastify";

import { RegisterCafeteriaUseCase } from "@/core/application/use-cases/cafeterias/register-cafeteria.use-case.js";
import { ProviderDrizzleRepository } from "@/modules/providers/infrastructure/drizzle/repositories/provider.drizzle.repository.js";
import { CafeteriaDrizzleRepository } from "@/modules/cafeterias/infrastructure/drizzle/repositories/cafeteria.drizzle.repository.js";
import { CafeteriaController } from "@/modules/cafeterias/infrastructure/http/controllers/cafeteria.controller.js";

export async function cafeteriaRoutes(app: FastifyInstance): Promise<void> {
    const providerRepository = new ProviderDrizzleRepository();
    const cafeteriaRepository = new CafeteriaDrizzleRepository();

    const registerCafeteriaUseCase = new RegisterCafeteriaUseCase(cafeteriaRepository, providerRepository);
    const cafeteriaController = new CafeteriaController(registerCafeteriaUseCase);

    app.post("/cafeterias", cafeteriaController.registerCafeteria.bind(cafeteriaController));
}
