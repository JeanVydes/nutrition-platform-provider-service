import type { FastifyReply, FastifyRequest } from 'fastify';
import { FindAllCafeteriasUseCase } from '../../../../../core/application/use-cases/cafeterias/find-all-cafeterias.use-case';
import { FindCafeteriaByIdUseCase } from '../../../../../core/application/use-cases/cafeterias/find-cafeteria-by-id.use-case';
import { FindCafeteriasByProviderIdUseCase } from '../../../../../core/application/use-cases/cafeterias/find-cafeterias-by-provider-id.use-case';
import { DeleteCafeteriaUseCase } from '../../../../../core/application/use-cases/cafeterias/delete-cafeteria.use-case';
import { RegisterCafeteriaUseCase } from '../../../../../core/application/use-cases/cafeterias/register-cafeteria.use-case';
import { UpdateCafeteriaUseCase } from '../../../../../core/application/use-cases/cafeterias/update-cafeteria.use-case';
import { z } from 'zod';

export const registerCafeteriaSchema = z.object({
  schoolId: z.string().uuid(),
  providerId: z.string().uuid(),
  name: z.string().optional(),
});

export const updateCafeteriaSchema = z.object({
  schoolId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  name: z.string().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required to update cafeteria',
});

export class CafeteriaController {
  constructor(
    private registerCafeteriaUseCase: RegisterCafeteriaUseCase,
    private findAllCafeteriasUseCase: FindAllCafeteriasUseCase,
    private findCafeteriaByIdUseCase: FindCafeteriaByIdUseCase,
    private findCafeteriasByProviderIdUseCase: FindCafeteriasByProviderIdUseCase,
    private updateCafeteriaUseCase: UpdateCafeteriaUseCase,
    private deleteCafeteriaUseCase: DeleteCafeteriaUseCase,
  ) { }

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

  async findAllCafeterias(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const cafeterias = await this.findAllCafeteriasUseCase.execute();
      return reply.status(200).send(cafeterias);
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async findCafeteriaById(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ id: z.string().uuid() }).parse(req.params);
      const cafeteria = await this.findCafeteriaByIdUseCase.execute(params.id);

      if (!cafeteria) {
        return reply.status(404).send({ message: 'Cafeteria not found' });
      }

      return reply.status(200).send(cafeteria);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async findCafeteriasByProviderId(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ providerId: z.string().uuid() }).parse(req.params);
      const cafeterias = await this.findCafeteriasByProviderIdUseCase.execute(params.providerId);
      return reply.status(200).send(cafeterias);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async updateCafeteria(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ id: z.string().uuid() }).parse(req.params);
      const data = updateCafeteriaSchema.parse(req.body);
      const cafeteria = await this.updateCafeteriaUseCase.execute(params.id, data);

      if (!cafeteria) {
        return reply.status(404).send({ message: 'Cafeteria not found' });
      }

      return reply.status(200).send(cafeteria);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async deleteCafeteria(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ id: z.string().uuid() }).parse(req.params);
      const deleted = await this.deleteCafeteriaUseCase.execute(params.id);

      if (!deleted) {
        return reply.status(404).send({ message: 'Cafeteria not found' });
      }

      return reply.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }
}
