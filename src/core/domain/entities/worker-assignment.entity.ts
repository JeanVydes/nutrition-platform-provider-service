export class WorkerAssignment {
    constructor(
        public readonly id: string,
        public readonly workerId: string,
        public readonly cafeteriaId: string,
        public readonly role: string | null,
        public readonly startDate: string | null,
        public readonly endDate: string | null
    ) { }
}
