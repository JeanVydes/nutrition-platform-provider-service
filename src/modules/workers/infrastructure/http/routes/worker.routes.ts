import type { FastifyInstance } from "fastify";

import { FindAllWorkerAssignmentsUseCase } from "@/core/application/use-cases/workers/find-all-worker-assignments.use-case.js";
import { FindAllWorkersUseCase } from "@/core/application/use-cases/workers/find-all-workers.use-case.js";
import { FindWorkerAssignmentsByCafeteriaIdUseCase } from "@/core/application/use-cases/workers/find-worker-assignments-by-cafeteria-id.use-case.js";
import { FindWorkerAssignmentsByWorkerIdUseCase } from "@/core/application/use-cases/workers/find-worker-assignments-by-worker-id.use-case.js";
import { FindWorkerByIdUseCase } from "@/core/application/use-cases/workers/find-worker-by-id.use-case.js";
import { FindWorkerByAccountIdUseCase } from "@/core/application/use-cases/workers/find-worker-by-account-id.use-case.js";
import { FindWorkersByProviderIdUseCase } from "@/core/application/use-cases/workers/find-workers-by-provider-id.use-case.js";
import { DeleteWorkerUseCase } from "@/core/application/use-cases/workers/delete-worker.use-case.js";
import { DeleteWorkerAssignmentUseCase } from "@/core/application/use-cases/workers/delete-worker-assignment.use-case.js";
import { RegisterWorkerUseCase } from "@/core/application/use-cases/workers/register-worker.use-case.js";
import { UpdateWorkerUseCase } from "@/core/application/use-cases/workers/update-worker.use-case.js";
import { AssignWorkerCafeteriaUseCase } from "@/core/application/use-cases/workers/assign-worker-cafeteria.use-case.js";
import { ProviderDrizzleRepository } from "@/modules/providers/infrastructure/drizzle/repositories/provider.drizzle.repository.js";
import { WorkerDrizzleRepository } from "@/modules/workers/infrastructure/drizzle/repositories/worker.drizzle.repository.js";
import { WorkerAssignmentDrizzleRepository } from "@/modules/workers/infrastructure/drizzle/repositories/worker-assignment.drizzle.repository.js";
import { CafeteriaDrizzleRepository } from "@/modules/cafeterias/infrastructure/drizzle/repositories/cafeteria.drizzle.repository.js";
import { WorkerController } from "@/modules/workers/infrastructure/http/controllers/worker.controller.js";
import { SecurityAccountValidationService } from "@/shared/security/security-account-validation.service.js";

export async function workerRoutes(app: FastifyInstance): Promise<void> {
    const providerRepository = new ProviderDrizzleRepository();
    const workerRepository = new WorkerDrizzleRepository();
    const assignmentRepository = new WorkerAssignmentDrizzleRepository();
    const cafeteriaRepository = new CafeteriaDrizzleRepository();
    const accountValidationService = new SecurityAccountValidationService();

    const registerWorkerUseCase = new RegisterWorkerUseCase(
        workerRepository,
        providerRepository,
        accountValidationService,
    );
    const updateWorkerUseCase = new UpdateWorkerUseCase(
        workerRepository,
        providerRepository,
        accountValidationService,
    );
    const deleteWorkerUseCase = new DeleteWorkerUseCase(workerRepository);
    const assignWorkerUseCase = new AssignWorkerCafeteriaUseCase(
        assignmentRepository,
        workerRepository,
        cafeteriaRepository
    );
    const deleteWorkerAssignmentUseCase = new DeleteWorkerAssignmentUseCase(assignmentRepository);
    const findAllWorkersUseCase = new FindAllWorkersUseCase(workerRepository);
    const findWorkerByIdUseCase = new FindWorkerByIdUseCase(workerRepository);
    const findWorkerByAccountIdUseCase = new FindWorkerByAccountIdUseCase(workerRepository);
    const findWorkersByProviderIdUseCase = new FindWorkersByProviderIdUseCase(workerRepository);
    const findAllWorkerAssignmentsUseCase = new FindAllWorkerAssignmentsUseCase(assignmentRepository);
    const findWorkerAssignmentsByWorkerIdUseCase = new FindWorkerAssignmentsByWorkerIdUseCase(assignmentRepository);
    const findWorkerAssignmentsByCafeteriaIdUseCase = new FindWorkerAssignmentsByCafeteriaIdUseCase(assignmentRepository);

    const workerController = new WorkerController(
        registerWorkerUseCase,
        updateWorkerUseCase,
        deleteWorkerUseCase,
        assignWorkerUseCase,
        deleteWorkerAssignmentUseCase,
        findAllWorkersUseCase,
        findWorkerByIdUseCase,
        findWorkerByAccountIdUseCase,
        findWorkersByProviderIdUseCase,
        findAllWorkerAssignmentsUseCase,
        findWorkerAssignmentsByWorkerIdUseCase,
        findWorkerAssignmentsByCafeteriaIdUseCase,
    );

    app.post("/workers", workerController.registerWorker.bind(workerController));
    app.patch("/workers/:id", workerController.updateWorker.bind(workerController));
    app.delete("/workers/:id", workerController.deleteWorker.bind(workerController));
    app.post("/workers/assignments", workerController.assignWorker.bind(workerController));
    app.delete("/workers/assignments/:id", workerController.deleteAssignment.bind(workerController));
    app.get("/workers", workerController.findAllWorkers.bind(workerController));
    app.get("/workers/provider/:providerId", workerController.findWorkersByProviderId.bind(workerController));
    app.get("/workers/account/:accountId", workerController.findWorkersByAccountId.bind(workerController));
    app.get("/workers/assignments", workerController.findAllAssignments.bind(workerController));
    app.get("/workers/assignments/worker/:workerId", workerController.findAssignmentsByWorkerId.bind(workerController));
    app.get("/workers/assignments/cafeteria/:cafeteriaId", workerController.findAssignmentsByCafeteriaId.bind(workerController));
    app.get("/workers/:id", workerController.findWorkerById.bind(workerController));
}
