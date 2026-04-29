import type { SchoolConfig } from "@/core/domain/entities/school-config.entity.js";
import type { ISchoolConfigRepository } from "@/core/domain/repositories/school-config.repository.js";

export class FindAllSchoolConfigsUseCase {
    constructor(private readonly schoolConfigRepo: ISchoolConfigRepository) { }

    async execute(): Promise<SchoolConfig[]> {
        return this.schoolConfigRepo.findAll();
    }
}
