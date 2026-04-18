import type { FastifyReply, FastifyRequest } from 'fastify';
import { RegisterCafeteriaUseCase } from '../../../../../core/application/use-cases/cafeterias/register-cafeteria.use-case';
import { z } from 'zod';

export const registerCafeteriaSchema = z.object({
  schoolId: z.string().uuid(),
  providerId: z.string().uuid(),
  name: z.string().optional(),
});

export class CafeteriaController {
  constructor(private registerCafeteriaUseCase: RegisterCafeteriaUseCase) { }

  async registerCafeteria(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = registerCafeteriaSchema.parse(req.body);
      const cafeteria = await this.registerCafeteriaUseCase.execute({
        schoolId: data.schoolId,
        providerId: data.providerId,
        name: data.name
      });
      return reply.status(201).send(cafeteria);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }
}
