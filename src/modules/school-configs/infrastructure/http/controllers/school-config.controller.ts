import type { FastifyReply, FastifyRequest } from 'fastify';
import { FindAllSchoolIdsUseCase } from '../../../../../core/application/use-cases/school-configs/find-all-school-ids.use-case';

export class SchoolConfigController {
  constructor(
    private readonly findAllSchoolIdsUseCase: FindAllSchoolIdsUseCase,
  ) {}

  async findAllSchoolIds(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const schoolIds = await this.findAllSchoolIdsUseCase.execute();
      return reply.status(200).send(schoolIds);
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  }
}
