import type { Cafeteria } from '../entities/cafeteria.entity';
export interface ICafeteriaRepository {
  create(cafeteria: Omit<Cafeteria, 'id' | 'createdAt'>): Promise<Cafeteria>;
  findById(id: string): Promise<Cafeteria | null>;
}
