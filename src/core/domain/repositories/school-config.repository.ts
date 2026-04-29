import type { SchoolConfig } from '../entities/school-config.entity';
export interface ISchoolConfigRepository {
  findAllSchoolIds(): Promise<string[]>;
  findAll(): Promise<SchoolConfig[]>;
}
