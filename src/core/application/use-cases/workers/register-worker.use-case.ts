import type { IWorkerRepository } from '../../../domain/repositories/worker.repository';
import type { IProviderRepository } from '../../../domain/repositories/provider.repository';
import type { Worker } from '../../../domain/entities/worker.entity';

interface RegisterWorkerDTO {
  accountId: string;
  providerId: string;
  position?: string;
  contractType?: string;
  hireDate?: string;
  salary?: string;
}

export class RegisterWorkerUseCase {
  constructor(
    private readonly workerRepo: IWorkerRepository,
    private readonly providerRepo: IProviderRepository
  ) {}

  async execute(dto: RegisterWorkerDTO): Promise<Worker> {
    const provider = await this.providerRepo.findById(dto.providerId);
    if (!provider) throw new Error('Provider not found');
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
