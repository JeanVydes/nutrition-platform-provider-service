export class Cafeteria {
    constructor(
        public readonly id: string,
        public readonly schoolId: string,
        public readonly providerId: string,
        public readonly name: string | null,
        public readonly createdAt: Date | null
    ) { }
}
