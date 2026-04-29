import type { IWorkerRepository } from '../../../domain/repositories/worker.repository';
import type { IProviderRepository } from '../../../domain/repositories/provider.repository';
import type { Worker } from '../../../domain/entities/worker.entity';
import type { IAccountValidationService } from '../../../domain/services/account-validation.service';

interface RegisterWorkerDTO {
  accountId: string;
  providerId: string;
  position?: string;
  contractType?: string;
  hireDate?: string;
  salary?: string;
  actorToken?: string;
}

export class RegisterWorkerUseCase {
  constructor(
    private readonly workerRepo: IWorkerRepository,
    private readonly providerRepo: IProviderRepository,
    private readonly accountValidationService: IAccountValidationService,
  ) { }

  async execute(dto: RegisterWorkerDTO): Promise<Worker> {
    const provider = await this.providerRepo.findById(dto.providerId);
    if (!provider) throw new Error('Provider not found');

    await this.accountValidationService.ensureAccountExists(dto.accountId, dto.actorToken);

    return this.workerRepo.create({
      accountId: dto.accountId,
      providerId: dto.providerId,
      position: dto.position || null,
      contractType: dto.contractType || null,
      hireDate: dto.hireDate || null,
      salary: dto.salary || null,
    });
  }
}
