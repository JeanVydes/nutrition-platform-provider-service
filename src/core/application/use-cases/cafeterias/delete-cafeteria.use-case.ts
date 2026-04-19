import type { ICafeteriaRepository } from "@/core/domain/repositories/cafeteria.repository.js";

export class DeleteCafeteriaUseCase {
    constructor(private readonly cafeteriaRepo: ICafeteriaRepository) { }

    async execute(id: string): Promise<boolean> {
        return this.cafeteriaRepo.deleteById(id);
    }
}
