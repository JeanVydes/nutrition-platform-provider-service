import type { Cafeteria } from '../entities/cafeteria.entity';
export interface ICafeteriaRepository {
  create(cafeteria: Omit<Cafeteria, 'id' | 'createdAt'>): Promise<Cafeteria>;
  findById(id: string): Promise<Cafeteria | null>;
  findAll(): Promise<Cafeteria[]>;
  findByProviderId(providerId: string): Promise<Cafeteria[]>;
}
