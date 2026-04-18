import type { FastifyReply, FastifyRequest } from 'fastify';
import { RegisterWorkerUseCase } from '../../../../../core/application/use-cases/workers/register-worker.use-case';
import { AssignWorkerCafeteriaUseCase } from '../../../../../core/application/use-cases/workers/assign-worker-cafeteria.use-case';
import { z } from 'zod';

export const registerWorkerSchema = z.object({
  accountId: z.string().uuid(),
  providerId: z.string().uuid(),
  position: z.string().optional(),
  contractType: z.string().optional(),
  hireDate: z.string().optional(),
  salary: z.string().optional(),
});

export const assignWorkerSchema = z.object({
  workerId: z.string().uuid(),
  cafeteriaId: z.string().uuid(),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export class WorkerController {
  constructor(
    private registerWorkerUseCase: RegisterWorkerUseCase,
    private assignWorkerCafeteriaUseCase: AssignWorkerCafeteriaUseCase
  ) { }

  async registerWorker(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = registerWorkerSchema.parse(req.body);
      const worker = await this.registerWorkerUseCase.execute(data);
      return reply.status(201).send(worker);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async assignWorker(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = assignWorkerSchema.parse(req.body);
      const assignment = await this.assignWorkerCafeteriaUseCase.execute(data);
      return reply.status(201).send(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }
}
