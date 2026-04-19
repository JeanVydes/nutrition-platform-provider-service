import type { ISchoolConfigRepository } from '@/core/domain/repositories/school-config.repository.js';
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
}
