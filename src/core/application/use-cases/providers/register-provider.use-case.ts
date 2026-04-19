import type { IProviderRepository } from '../../../domain/repositories/provider.repository';
import type { Provider } from '../../../domain/entities/provider.entity';

interface RegisterProviderDTO {
  accountId: string;
  name: string;
  companyRegistration?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export class RegisterProviderUseCase {
  constructor(private readonly providerRepo: IProviderRepository) {}

  async execute(dto: RegisterProviderDTO): Promise<Provider> {
    return this.providerRepo.create({
      accountId: dto.accountId,
      name: dto.name,
      companyRegistration: dto.companyRegistration || null,
      contactEmail: dto.contactEmail || null,
      contactPhone: dto.contactPhone || null,
    });
  }
}
