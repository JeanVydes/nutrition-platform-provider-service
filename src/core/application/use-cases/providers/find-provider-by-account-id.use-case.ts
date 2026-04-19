import type { Provider } from "@/core/domain/entities/provider.entity.js";
import type { IProviderRepository } from "@/core/domain/repositories/provider.repository.js";

export class FindProviderByAccountIdUseCase {
    constructor(private readonly providerRepo: IProviderRepository) { }

    async execute(accountId: string): Promise<Provider | null> {
        return this.providerRepo.findByAccountId(accountId);
    }
}
