import type { ISchoolConfigRepository } from '@/core/domain/repositories/school-config.repository.js';
import { SchoolConfig } from '@/core/domain/entities/school-config.entity.js';
import { db } from '@/shared/database/connection.js';
import { schoolDbConfigs } from '@/shared/database/schema.js';

export class SchoolConfigDrizzleRepository implements ISchoolConfigRepository {
    async findAllSchoolIds(): Promise<string[]> {
        try {
            const rows = await db
                .select({ idColegio: schoolDbConfigs.id })
                .from(schoolDbConfigs);

            return rows.map((row) => row.idColegio);
        } catch (error) {
            const message = (error as Error).message || "";
            if (
                message.includes('relation "colegios_db_config" does not exist') ||
                message.includes('Failed query: select "id_colegio" from "colegios_db_config"')
            ) {
                return [];
            }

            throw error;
        }
    }

    async findAll(): Promise<SchoolConfig[]> {
        try {
            const rows = await db.select().from(schoolDbConfigs);
            return rows.map((row) => new SchoolConfig(
                row.id,
                row.hostDb,
                row.portDb,
                row.nameDb,
                row.userDb ?? null,
                row.schoolName ?? null,
                row.createdAt ?? null
            ));
        } catch (error) {
            const message = (error as Error).message || "";
            if (
                message.includes('relation "colegios_db_config" does not exist') ||
                message.includes('Failed query: select')
            ) {
                return [];
            }
            throw error;
        }
    }
}
