import type { Cafeteria } from "@/core/domain/entities/cafeteria.entity.js";
import type { ICafeteriaRepository } from "@/core/domain/repositories/cafeteria.repository.js";
import type { IProviderRepository } from "@/core/domain/repositories/provider.repository.js";

interface UpdateCafeteriaDTO {
    schoolId?: string;
    providerId?: string;
    name?: string | null;
}

export class UpdateCafeteriaUseCase {
    constructor(
        private readonly cafeteriaRepo: ICafeteriaRepository,
        private readonly providerRepo: IProviderRepository,
    ) { }

    async execute(id: string, dto: UpdateCafeteriaDTO): Promise<Cafeteria | null> {
        if (dto.providerId) {
            const provider = await this.providerRepo.findById(dto.providerId);
            if (!provider) throw new Error("Provider not found");
        }

        return this.cafeteriaRepo.update(id, {
            schoolId: dto.schoolId,
            providerId: dto.providerId,
            name: dto.name,
        });
    }
}
