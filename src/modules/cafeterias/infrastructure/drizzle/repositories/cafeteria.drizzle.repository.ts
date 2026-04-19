import { eq } from "drizzle-orm";

import { Cafeteria } from "@/core/domain/entities/cafeteria.entity.js";
import type { ICafeteriaRepository } from "@/core/domain/repositories/cafeteria.repository.js";
import { db } from "@/shared/database/connection.js";
import { cafeterias } from "@/shared/database/schema.js";

export class CafeteriaDrizzleRepository implements ICafeteriaRepository {
    async create(cafeteria: Omit<Cafeteria, "id" | "createdAt">): Promise<Cafeteria> {
        const [row] = await db
            .insert(cafeterias)
            .values({
                schoolId: cafeteria.schoolId,
                providerId: cafeteria.providerId,
                name: cafeteria.name,
            })
            .returning();

        if (!row) {
            throw new Error("Cafeteria could not be created");
        }

        return new Cafeteria(
            row.id,
            row.schoolId,
            row.providerId,
            row.name ?? null,
            row.createdAt ?? null
        );
    }

    async findById(id: string): Promise<Cafeteria | null> {
        const [row] = await db
            .select()
            .from(cafeterias)
            .where(eq(cafeterias.id, id))
            .limit(1);

        if (!row) return null;

        return new Cafeteria(
            row.id,
            row.schoolId,
            row.providerId,
            row.name ?? null,
            row.createdAt ?? null
        );
    }

    async findAll(): Promise<Cafeteria[]> {
        const rows = await db
            .select()
            .from(cafeterias);

        return rows.map((row) => new Cafeteria(
            row.id,
            row.schoolId,
            row.providerId,
            row.name ?? null,
            row.createdAt ?? null
        ));
    }

    async findByProviderId(providerId: string): Promise<Cafeteria[]> {
        const rows = await db
            .select()
            .from(cafeterias)
            .where(eq(cafeterias.providerId, providerId));

        return rows.map((row) => new Cafeteria(
            row.id,
            row.schoolId,
            row.providerId,
            row.name ?? null,
            row.createdAt ?? null
        ));
    }

    async update(id: string, cafeteria: Partial<Omit<Cafeteria, "id" | "createdAt">>): Promise<Cafeteria | null> {
        const values: Partial<{
            schoolId: string;
            providerId: string;
            name: string | null;
        }> = {
            schoolId: cafeteria.schoolId,
            providerId: cafeteria.providerId,
            name: cafeteria.name,
        };

        Object.keys(values).forEach((key) => {
            if (values[key as keyof typeof values] === undefined) {
                delete values[key as keyof typeof values];
            }
        });

        if (Object.keys(values).length === 0) {
            return this.findById(id);
        }

        const [row] = await db
            .update(cafeterias)
            .set(values)
            .where(eq(cafeterias.id, id))
            .returning();

        if (!row) return null;

        return new Cafeteria(
            row.id,
            row.schoolId,
            row.providerId,
            row.name ?? null,
            row.createdAt ?? null
        );
    }

    async deleteById(id: string): Promise<boolean> {
        const [row] = await db
            .delete(cafeterias)
            .where(eq(cafeterias.id, id))
            .returning({ id: cafeterias.id });

        return Boolean(row);
    }
}
