import type { Cafeteria } from "@/core/domain/entities/cafeteria.entity.js";
import type { ICafeteriaRepository } from "@/core/domain/repositories/cafeteria.repository.js";

export class FindCafeteriasByProviderIdUseCase {
    constructor(private readonly cafeteriaRepo: ICafeteriaRepository) { }

    async execute(providerId: string): Promise<Cafeteria[]> {
        return this.cafeteriaRepo.findByProviderId(providerId);
    }
}
