import type { Worker } from "@/core/domain/entities/worker.entity.js";
import type { IProviderRepository } from "@/core/domain/repositories/provider.repository.js";
import type { IWorkerRepository } from "@/core/domain/repositories/worker.repository.js";
import type { IAccountValidationService } from "@/core/domain/services/account-validation.service.js";

interface UpdateWorkerDTO {
    accountId?: string;
    providerId?: string;
    position?: string | null;
    contractType?: string | null;
    hireDate?: string | null;
    salary?: string | null;
}

export class UpdateWorkerUseCase {
    constructor(
        private readonly workerRepo: IWorkerRepository,
        private readonly providerRepo: IProviderRepository,
        private readonly accountValidationService: IAccountValidationService,
    ) { }

    async execute(id: string, dto: UpdateWorkerDTO): Promise<Worker | null> {
        if (dto.providerId) {
            const provider = await this.providerRepo.findById(dto.providerId);
            if (!provider) throw new Error("Provider not found");
        }

        if (dto.accountId) {
            await this.accountValidationService.ensureAccountExists(dto.accountId);
        }

        return this.workerRepo.update(id, {
            accountId: dto.accountId,
            providerId: dto.providerId,
            position: dto.position,
            contractType: dto.contractType,
            hireDate: dto.hireDate,
            salary: dto.salary,
        });
    }
}
