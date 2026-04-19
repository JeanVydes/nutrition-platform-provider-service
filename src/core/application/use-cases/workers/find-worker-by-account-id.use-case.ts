import type { Worker } from "@/core/domain/entities/worker.entity.js";
import type { IWorkerRepository } from "@/core/domain/repositories/worker.repository.js";

export class FindWorkerByAccountIdUseCase {
    constructor(private readonly workerRepo: IWorkerRepository) { }

    async execute(accountId: string): Promise<Worker | null> {
        return this.workerRepo.findByAccountId(accountId);
    }
}
