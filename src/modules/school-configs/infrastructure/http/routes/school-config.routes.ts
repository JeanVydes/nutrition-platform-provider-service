import type { FastifyInstance } from 'fastify';

import { FindAllSchoolIdsUseCase } from '@/core/application/use-cases/school-configs/find-all-school-ids.use-case.js';
import { FindAllSchoolConfigsUseCase } from '@/core/application/use-cases/school-configs/find-all-school-configs.use-case.js';
import { SchoolConfigDrizzleRepository } from '@/modules/school-configs/infrastructure/drizzle/repositories/school-config.drizzle.repository.js';
import { SchoolConfigController } from '@/modules/school-configs/infrastructure/http/controllers/school-config.controller.js';

export async function schoolConfigRoutes(app: FastifyInstance): Promise<void> {
    const schoolConfigRepository = new SchoolConfigDrizzleRepository();
    const findAllSchoolIdsUseCase = new FindAllSchoolIdsUseCase(schoolConfigRepository);
    const findAllSchoolConfigsUseCase = new FindAllSchoolConfigsUseCase(schoolConfigRepository);
    const schoolConfigController = new SchoolConfigController(
        findAllSchoolIdsUseCase,
        findAllSchoolConfigsUseCase
    );

    app.get('/school-configs/school-ids', schoolConfigController.findAllSchoolIds.bind(schoolConfigController));
    app.get('/school-configs', schoolConfigController.findAllSchoolConfigs.bind(schoolConfigController));
}
