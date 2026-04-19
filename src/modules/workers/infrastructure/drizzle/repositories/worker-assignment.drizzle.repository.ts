import { eq } from "drizzle-orm";

import { WorkerAssignment } from "@/core/domain/entities/worker-assignment.entity.js";
import type { IWorkerAssignmentRepository } from "@/core/domain/repositories/worker-assignment.repository.js";
import { db } from "@/shared/database/connection.js";
import { workerAssignments } from "@/shared/database/schema.js";

export class WorkerAssignmentDrizzleRepository implements IWorkerAssignmentRepository {
    async create(assignment: Omit<WorkerAssignment, "id">): Promise<WorkerAssignment> {
        const [row] = await db
            .insert(workerAssignments)
            .values({
                workerId: assignment.workerId,
                cafeteriaId: assignment.cafeteriaId,
                role: assignment.role,
                startDate: assignment.startDate,
                endDate: assignment.endDate,
            })
            .returning();

        if (!row) {
            throw new Error("Worker assignment could not be created");
        }

        return new WorkerAssignment(
            row.id,
            row.workerId,
            row.cafeteriaId,
            row.role ?? null,
            row.startDate ?? null,
            row.endDate ?? null
        );
    }

    async findAll(): Promise<WorkerAssignment[]> {
        const rows = await db
            .select()
            .from(workerAssignments);

        return rows.map((row) => new WorkerAssignment(
            row.id,
            row.workerId,
            row.cafeteriaId,
            row.role ?? null,
            row.startDate ?? null,
            row.endDate ?? null
        ));
    }

    async findByWorkerId(workerId: string): Promise<WorkerAssignment[]> {
        const rows = await db
            .select()
            .from(workerAssignments)
            .where(eq(workerAssignments.workerId, workerId));

        return rows.map((row) => new WorkerAssignment(
            row.id,
            row.workerId,
            row.cafeteriaId,
            row.role ?? null,
            row.startDate ?? null,
            row.endDate ?? null
        ));
    }

    async findByCafeteriaId(cafeteriaId: string): Promise<WorkerAssignment[]> {
        const rows = await db
            .select()
            .from(workerAssignments)
            .where(eq(workerAssignments.cafeteriaId, cafeteriaId));

        return rows.map((row) => new WorkerAssignment(
            row.id,
            row.workerId,
            row.cafeteriaId,
            row.role ?? null,
            row.startDate ?? null,
            row.endDate ?? null
        ));
    }

    async deleteById(id: string): Promise<boolean> {
        const [row] = await db
            .delete(workerAssignments)
            .where(eq(workerAssignments.id, id))
            .returning({ id: workerAssignments.id });

        return Boolean(row);
    }
}
