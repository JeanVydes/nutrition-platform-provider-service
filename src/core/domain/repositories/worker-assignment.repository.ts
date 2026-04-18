import type { WorkerAssignment } from '../entities/worker-assignment.entity';
export interface IWorkerAssignmentRepository {
  create(assignment: Omit<WorkerAssignment, 'id'>): Promise<WorkerAssignment>;
}
