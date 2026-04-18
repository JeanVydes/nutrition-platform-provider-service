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
}
