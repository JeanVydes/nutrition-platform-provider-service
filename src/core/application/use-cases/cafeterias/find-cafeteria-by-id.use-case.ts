import type { Cafeteria } from "@/core/domain/entities/cafeteria.entity.js";
import type { ICafeteriaRepository } from "@/core/domain/repositories/cafeteria.repository.js";

export class FindCafeteriaByIdUseCase {
    constructor(private readonly cafeteriaRepo: ICafeteriaRepository) { }

    async execute(id: string): Promise<Cafeteria | null> {
        return this.cafeteriaRepo.findById(id);
    }
}
