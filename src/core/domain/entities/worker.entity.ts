export type EmploymentStatus = 'activo' | 'suspendido' | 'retirado';

export class Worker {
  constructor(
    public readonly id: string,
    public readonly accountId: string,
    public readonly providerId: string,
    public readonly employmentStatus: EmploymentStatus | null,
    public readonly position: string | null,
    public readonly contractType: string | null,
    public readonly hireDate: string | null,
    public readonly salary: string | null,
    public readonly createdAt: Date | null
  ) {}
}
