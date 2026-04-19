import type { Worker } from "@/core/domain/entities/worker.entity.js";
import type { IWorkerRepository } from "@/core/domain/repositories/worker.repository.js";

export class FindWorkersByProviderIdUseCase {
    constructor(private readonly workerRepo: IWorkerRepository) { }

    async execute(providerId: string): Promise<Worker[]> {
        return this.workerRepo.findByProviderId(providerId);
    }
}
