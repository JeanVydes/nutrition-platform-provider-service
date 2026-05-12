import type { IProviderRepository } from '@/core/domain/repositories/provider.repository';
import type { Provider } from '@/core/domain/entities/provider.entity';

interface RegisterProviderDTO {
    accountId: string;
    name: string;
    companyRegistration?: string;
    contactEmail?: string;
    contactPhone?: string;
    pais?: string;
    ciudad?: string;
    billingAddress?: string;
    oficina?: string;
}

export class RegisterProviderUseCase {
    constructor(private readonly providerRepo: IProviderRepository) { }

    async execute(dto: RegisterProviderDTO): Promise<Provider> {
        return this.providerRepo.create({
            accountId: dto.accountId,
            name: dto.name,
            companyRegistration: dto.companyRegistration || null,
            contactEmail: dto.contactEmail || null,
            contactPhone: dto.contactPhone || null,
            pais: dto.pais || null,
            ciudad: dto.ciudad || null,
            billingAddress: dto.billingAddress || null,
            oficina: dto.oficina || null,
        });
    }
}
