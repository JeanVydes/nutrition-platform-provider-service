import type { Cafeteria } from "@/core/domain/entities/cafeteria.entity.js";
import type { ICafeteriaRepository } from "@/core/domain/repositories/cafeteria.repository.js";

export class FindAllCafeteriasUseCase {
    constructor(private readonly cafeteriaRepo: ICafeteriaRepository) { }

    async execute(): Promise<Cafeteria[]> {
        return this.cafeteriaRepo.findAll();
    }
}
