import type { ICafeteriaRepository } from '../../../domain/repositories/cafeteria.repository';
import type { IProviderRepository } from '../../../domain/repositories/provider.repository';
import type { Cafeteria } from '../../../domain/entities/cafeteria.entity';

interface RegisterCafeteriaDTO {
  schoolId: string;
  providerId: string;
  name?: string;
}

export class RegisterCafeteriaUseCase {
  constructor(
    private readonly cafeteriaRepo: ICafeteriaRepository,
    private readonly providerRepo: IProviderRepository
  ) {}

  async execute(dto: RegisterCafeteriaDTO): Promise<Cafeteria> {
    const provider = await this.providerRepo.findById(dto.providerId);
    if (!provider) throw new Error('Provider not found');
    return this.cafeteriaRepo.create({
      schoolId: dto.schoolId,
      providerId: dto.providerId,
      name: dto.name || null,
    });
  }
}
