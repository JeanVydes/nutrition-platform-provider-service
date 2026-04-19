import type { Worker } from "@/core/domain/entities/worker.entity.js";
import type { IWorkerRepository } from "@/core/domain/repositories/worker.repository.js";

export class FindWorkerByIdUseCase {
    constructor(private readonly workerRepo: IWorkerRepository) { }

    async execute(id: string): Promise<Worker | null> {
        return this.workerRepo.findById(id);
    }
}
