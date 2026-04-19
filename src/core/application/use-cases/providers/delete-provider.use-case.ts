import type { IProviderRepository } from "@/core/domain/repositories/provider.repository.js";

export class DeleteProviderUseCase {
    constructor(private readonly providerRepo: IProviderRepository) { }

    async execute(id: string): Promise<boolean> {
        return this.providerRepo.deleteById(id);
    }
}
