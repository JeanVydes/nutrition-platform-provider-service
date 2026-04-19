import type { WorkerAssignment } from "@/core/domain/entities/worker-assignment.entity.js";
import type { IWorkerAssignmentRepository } from "@/core/domain/repositories/worker-assignment.repository.js";

export class FindWorkerAssignmentsByCafeteriaIdUseCase {
    constructor(private readonly assignmentRepo: IWorkerAssignmentRepository) { }

    async execute(cafeteriaId: string): Promise<WorkerAssignment[]> {
        return this.assignmentRepo.findByCafeteriaId(cafeteriaId);
    }
}
