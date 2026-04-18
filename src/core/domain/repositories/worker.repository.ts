import type { Worker } from '../entities/worker.entity';
export interface IWorkerRepository {
  create(worker: Omit<Worker, 'id' | 'createdAt' | 'employmentStatus'>): Promise<Worker>;
  findById(id: string): Promise<Worker | null>;
}
