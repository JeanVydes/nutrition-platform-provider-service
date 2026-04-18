import type { Provider } from '../entities/provider.entity';
export interface IProviderRepository {
  create(provider: Omit<Provider, 'id' | 'createdAt'>): Promise<Provider>;
  findById(id: string): Promise<Provider | null>;
  findByAccountId(accountId: string): Promise<Provider | null>;
}
