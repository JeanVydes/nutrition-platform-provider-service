import type { Worker } from "@/core/domain/entities/worker.entity.js";
import type { IWorkerRepository } from "@/core/domain/repositories/worker.repository.js";

export class FindAllWorkersUseCase {
    constructor(private readonly workerRepo: IWorkerRepository) { }

    async execute(): Promise<Worker[]> {
        return this.workerRepo.findAll();
    }
}
