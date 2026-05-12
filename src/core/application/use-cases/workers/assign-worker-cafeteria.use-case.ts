import type { IWorkerAssignmentRepository } from '@/core/domain/repositories/worker-assignment.repository';
import type { IWorkerRepository } from '@/core/domain/repositories/worker.repository';
import type { ICafeteriaRepository } from '@/core/domain/repositories/cafeteria.repository';
import type { WorkerAssignment } from '@/core/domain/entities/worker-assignment.entity';

interface AssignWorkerDTO {
    workerId: string;
    cafeteriaId: string;
    role?: string;
    startDate?: string;
    endDate?: string;
}

export class AssignWorkerCafeteriaUseCase {
    constructor(
        private readonly assignmentRepo: IWorkerAssignmentRepository,
        private readonly workerRepo: IWorkerRepository,
        private readonly cafeteriaRepo: ICafeteriaRepository
    ) { }

    async execute(dto: AssignWorkerDTO): Promise<WorkerAssignment> {
        const worker = await this.workerRepo.findById(dto.workerId);
        if (!worker) throw new Error('Worker not found');
        const cafeteria = await this.cafeteriaRepo.findById(dto.cafeteriaId);
        if (!cafeteria) throw new Error('Cafeteria not found');

        return this.assignmentRepo.create({
            workerId: dto.workerId,
            cafeteriaId: dto.cafeteriaId,
            role: dto.role || null,
            startDate: dto.startDate || null,
            endDate: dto.endDate || null,
        });
    }
}
