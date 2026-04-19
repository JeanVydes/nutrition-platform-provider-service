import type { Provider } from "@/core/domain/entities/provider.entity.js";
import type { IProviderRepository } from "@/core/domain/repositories/provider.repository.js";

interface UpdateProviderDTO {
    name?: string;
    companyRegistration?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
}

export class UpdateProviderUseCase {
    constructor(private readonly providerRepo: IProviderRepository) { }

    async execute(id: string, dto: UpdateProviderDTO): Promise<Provider | null> {
        return this.providerRepo.update(id, {
            name: dto.name,
            companyRegistration: dto.companyRegistration,
            contactEmail: dto.contactEmail,
            contactPhone: dto.contactPhone,
        });
    }
}
