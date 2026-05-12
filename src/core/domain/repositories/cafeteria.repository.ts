import type { Cafeteria } from '@/core/domain/entities/cafeteria.entity';
export interface ICafeteriaRepository {
    create(cafeteria: Omit<Cafeteria, 'id' | 'createdAt'>): Promise<Cafeteria>;
    findById(id: string): Promise<Cafeteria | null>;
    findAll(): Promise<Cafeteria[]>;
    findByProviderId(providerId: string): Promise<Cafeteria[]>;
    update(id: string, cafeteria: Partial<Omit<Cafeteria, 'id' | 'createdAt'>>): Promise<Cafeteria | null>;
    deleteById(id: string): Promise<boolean>;
}
