export class Provider {
    constructor(
        public readonly id: string,
        public readonly accountId: string,
        public readonly name: string,
        public readonly companyRegistration: string | null,
        public readonly contactEmail: string | null,
        public readonly contactPhone: string | null,
        public readonly createdAt: Date | null,
        public readonly pais?: string | null,
        public readonly ciudad?: string | null,
        public readonly billingAddress?: string | null,
        public readonly oficina?: string | null
    ) { }
}
