import type { IWorkerRepository } from "@/core/domain/repositories/worker.repository.js";

export class DeleteWorkerUseCase {
    constructor(private readonly workerRepo: IWorkerRepository) { }

    async execute(id: string): Promise<boolean> {
        return this.workerRepo.deleteById(id);
    }
}
