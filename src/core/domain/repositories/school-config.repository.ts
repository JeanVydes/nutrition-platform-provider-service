import type { SchoolConfig } from '@/core/domain/entities/school-config.entity';
export interface ISchoolConfigRepository {
  findAllSchoolIds(): Promise<string[]>;
  findAll(): Promise<SchoolConfig[]>;
}
