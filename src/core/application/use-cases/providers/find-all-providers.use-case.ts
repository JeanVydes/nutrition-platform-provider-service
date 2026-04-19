import type { Provider } from "@/core/domain/entities/provider.entity.js";
import type { IProviderRepository } from "@/core/domain/repositories/provider.repository.js";

export class FindAllProvidersUseCase {
    constructor(private readonly providerRepo: IProviderRepository) { }

    async execute(): Promise<Provider[]> {
        return this.providerRepo.findAll();
    }
}
