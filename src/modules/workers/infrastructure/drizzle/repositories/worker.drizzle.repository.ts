import { eq } from "drizzle-orm";

import { Worker } from "@/core/domain/entities/worker.entity.js";
import type { IWorkerRepository } from "@/core/domain/repositories/worker.repository.js";
import { db } from "@/shared/database/connection.js";
import { workers } from "@/shared/database/schema.js";

export class WorkerDrizzleRepository implements IWorkerRepository {
    async create(worker: Omit<Worker, "id" | "createdAt" | "employmentStatus">): Promise<Worker> {
        const [row] = await db
            .insert(workers)
            .values({
                accountId: worker.accountId,
                providerId: worker.providerId,
                position: worker.position,
                contractType: worker.contractType,
                hireDate: worker.hireDate,
                salary: worker.salary,
            })
            .returning();

        if (!row) {
            throw new Error("Worker could not be created");
        }

        return new Worker(
            row.id,
            row.accountId,
            row.providerId,
            row.employmentStatus ?? null,
            row.position ?? null,
            row.contractType ?? null,
            row.hireDate ?? null,
            row.salary ?? null,
            row.createdAt ?? null
        );
    }

    async findById(id: string): Promise<Worker | null> {
        const [row] = await db
            .select()
            .from(workers)
            .where(eq(workers.id, id))
            .limit(1);

        if (!row) return null;

        return new Worker(
            row.id,
            row.accountId,
            row.providerId,
            row.employmentStatus ?? null,
            row.position ?? null,
            row.contractType ?? null,
            row.hireDate ?? null,
            row.salary ?? null,
            row.createdAt ?? null
        );
    }
}
