import type { WorkerAssignment } from '../entities/worker-assignment.entity';
export interface IWorkerAssignmentRepository {
  create(assignment: Omit<WorkerAssignment, 'id'>): Promise<WorkerAssignment>;
  findAll(): Promise<WorkerAssignment[]>;
  findByWorkerId(workerId: string): Promise<WorkerAssignment[]>;
  findByCafeteriaId(cafeteriaId: string): Promise<WorkerAssignment[]>;
}
