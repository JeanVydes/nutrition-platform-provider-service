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
}
