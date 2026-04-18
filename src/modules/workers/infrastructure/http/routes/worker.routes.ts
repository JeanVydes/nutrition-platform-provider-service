import type { FastifyInstance } from "fastify";

import { RegisterWorkerUseCase } from "@/core/application/use-cases/workers/register-worker.use-case.js";
import { AssignWorkerCafeteriaUseCase } from "@/core/application/use-cases/workers/assign-worker-cafeteria.use-case.js";
import { ProviderDrizzleRepository } from "@/modules/providers/infrastructure/drizzle/repositories/provider.drizzle.repository.js";
import { WorkerDrizzleRepository } from "@/modules/workers/infrastructure/drizzle/repositories/worker.drizzle.repository.js";
import { WorkerAssignmentDrizzleRepository } from "@/modules/workers/infrastructure/drizzle/repositories/worker-assignment.drizzle.repository.js";
import { CafeteriaDrizzleRepository } from "@/modules/cafeterias/infrastructure/drizzle/repositories/cafeteria.drizzle.repository.js";
import { WorkerController } from "@/modules/workers/infrastructure/http/controllers/worker.controller.js";

export async function workerRoutes(app: FastifyInstance): Promise<void> {
    const providerRepository = new ProviderDrizzleRepository();
    const workerRepository = new WorkerDrizzleRepository();
    const assignmentRepository = new WorkerAssignmentDrizzleRepository();
    const cafeteriaRepository = new CafeteriaDrizzleRepository();

    const registerWorkerUseCase = new RegisterWorkerUseCase(workerRepository, providerRepository);
    const assignWorkerUseCase = new AssignWorkerCafeteriaUseCase(
        assignmentRepository,
        workerRepository,
        cafeteriaRepository
    );

    const workerController = new WorkerController(registerWorkerUseCase, assignWorkerUseCase);

    app.post("/workers", workerController.registerWorker.bind(workerController));
    app.post("/workers/assignments", workerController.assignWorker.bind(workerController));
}
