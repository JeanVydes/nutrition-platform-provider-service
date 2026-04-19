import type { Worker } from '../entities/worker.entity';
export interface IWorkerRepository {
  create(worker: Omit<Worker, 'id' | 'createdAt' | 'employmentStatus'>): Promise<Worker>;
  findById(id: string): Promise<Worker | null>;
  findAll(): Promise<Worker[]>;
  findByProviderId(providerId: string): Promise<Worker[]>;
  findByAccountId(accountId: string): Promise<Worker | null>;
}
