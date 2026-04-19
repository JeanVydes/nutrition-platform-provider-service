import type { IWorkerAssignmentRepository } from "@/core/domain/repositories/worker-assignment.repository.js";

export class DeleteWorkerAssignmentUseCase {
    constructor(private readonly assignmentRepo: IWorkerAssignmentRepository) { }

    async execute(id: string): Promise<boolean> {
        return this.assignmentRepo.deleteById(id);
    }
}
