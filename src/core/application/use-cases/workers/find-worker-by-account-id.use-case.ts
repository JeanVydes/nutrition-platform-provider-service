import type { Worker } from "@/core/domain/entities/worker.entity.js";
import type { IWorkerRepository } from "@/core/domain/repositories/worker.repository.js";

export class FindWorkerByAccountIdUseCase {
    constructor(private readonly workerRepo: IWorkerRepository) { }

    async execute(accountId: string): Promise<Worker[]> {
        return this.workerRepo.findByAccountId(accountId);
    }
}
