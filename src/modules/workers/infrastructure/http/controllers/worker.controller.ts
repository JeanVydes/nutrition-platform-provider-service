import type { FastifyReply, FastifyRequest } from 'fastify';
import { FindAllWorkerAssignmentsUseCase } from '../../../../../core/application/use-cases/workers/find-all-worker-assignments.use-case';
import { FindAllWorkersUseCase } from '../../../../../core/application/use-cases/workers/find-all-workers.use-case';
import { FindWorkerAssignmentsByCafeteriaIdUseCase } from '../../../../../core/application/use-cases/workers/find-worker-assignments-by-cafeteria-id.use-case';
import { FindWorkerAssignmentsByWorkerIdUseCase } from '../../../../../core/application/use-cases/workers/find-worker-assignments-by-worker-id.use-case';
import { FindWorkerByIdUseCase } from '../../../../../core/application/use-cases/workers/find-worker-by-id.use-case';
import { FindWorkerByAccountIdUseCase } from '../../../../../core/application/use-cases/workers/find-worker-by-account-id.use-case';
import { FindWorkersByProviderIdUseCase } from '../../../../../core/application/use-cases/workers/find-workers-by-provider-id.use-case';
import { DeleteWorkerUseCase } from '../../../../../core/application/use-cases/workers/delete-worker.use-case';
import { DeleteWorkerAssignmentUseCase } from '../../../../../core/application/use-cases/workers/delete-worker-assignment.use-case';
import { RegisterWorkerUseCase } from '../../../../../core/application/use-cases/workers/register-worker.use-case';
import { UpdateWorkerUseCase } from '../../../../../core/application/use-cases/workers/update-worker.use-case';
import { AssignWorkerCafeteriaUseCase } from '../../../../../core/application/use-cases/workers/assign-worker-cafeteria.use-case';
import { z } from 'zod';

export const registerWorkerSchema = z.object({
  accountId: z.string().uuid(),
  providerId: z.string().uuid(),
  position: z.string().optional(),
  contractType: z.string().optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'hireDate must be YYYY-MM-DD').optional(),
  salary: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'salary must be a numeric string with up to 2 decimals')
    .refine((value) => Number(value) <= 99999999.99, 'salary exceeds max allowed (99999999.99)')
    .optional(),
});

export const assignWorkerSchema = z.object({
  workerId: z.string().uuid(),
  cafeteriaId: z.string().uuid(),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateWorkerSchema = z.object({
  accountId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  position: z.string().nullable().optional(),
  contractType: z.string().nullable().optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'hireDate must be YYYY-MM-DD').nullable().optional(),
  salary: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'salary must be a numeric string with up to 2 decimals')
    .refine((value) => Number(value) <= 99999999.99, 'salary exceeds max allowed (99999999.99)')
    .nullable()
    .optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required to update worker',
});

export class WorkerController {
  constructor(
    private registerWorkerUseCase: RegisterWorkerUseCase,
    private updateWorkerUseCase: UpdateWorkerUseCase,
    private deleteWorkerUseCase: DeleteWorkerUseCase,
    private assignWorkerCafeteriaUseCase: AssignWorkerCafeteriaUseCase,
    private deleteWorkerAssignmentUseCase: DeleteWorkerAssignmentUseCase,
    private findAllWorkersUseCase: FindAllWorkersUseCase,
    private findWorkerByIdUseCase: FindWorkerByIdUseCase,
    private findWorkerByAccountIdUseCase: FindWorkerByAccountIdUseCase,
    private findWorkersByProviderIdUseCase: FindWorkersByProviderIdUseCase,
    private findAllWorkerAssignmentsUseCase: FindAllWorkerAssignmentsUseCase,
    private findWorkerAssignmentsByWorkerIdUseCase: FindWorkerAssignmentsByWorkerIdUseCase,
    private findWorkerAssignmentsByCafeteriaIdUseCase: FindWorkerAssignmentsByCafeteriaIdUseCase,
  ) { }

  private getAccessToken(req: FastifyRequest): string | undefined {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) return undefined;
    const token = authorization.slice('Bearer '.length).trim();
    return token || undefined;
  }

  async registerWorker(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = registerWorkerSchema.parse(req.body);
      const worker = await this.registerWorkerUseCase.execute({ ...data, actorToken: this.getAccessToken(req) });
      return reply.status(201).send(worker);
    } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async updateWorker(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ id: z.string().uuid() }).parse(req.params);
      const data = updateWorkerSchema.parse(req.body);
      const worker = await this.updateWorkerUseCase.execute(params.id, { ...data, actorToken: this.getAccessToken(req) });

      if (!worker) {
        return reply.status(404).send({ message: 'Worker not found' });
      }

      return reply.status(200).send(worker);
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

  async deleteWorker(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ id: z.string().uuid() }).parse(req.params);
      const deleted = await this.deleteWorkerUseCase.execute(params.id);

      if (!deleted) {
        return reply.status(404).send({ message: 'Worker not found' });
      }

      return reply.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async deleteAssignment(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ id: z.string().uuid() }).parse(req.params);
      const deleted = await this.deleteWorkerAssignmentUseCase.execute(params.id);

      if (!deleted) {
        return reply.status(404).send({ message: 'Assignment not found' });
      }

      return reply.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async findAllWorkers(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const workers = await this.findAllWorkersUseCase.execute();
      return reply.status(200).send(workers);
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async findWorkerById(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ id: z.string().uuid() }).parse(req.params);
      const worker = await this.findWorkerByIdUseCase.execute(params.id);

      if (!worker) {
        return reply.status(404).send({ message: 'Worker not found' });
      }

      return reply.status(200).send(worker);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async findWorkersByProviderId(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ providerId: z.string().uuid() }).parse(req.params);
      const workers = await this.findWorkersByProviderIdUseCase.execute(params.providerId);
      return reply.status(200).send(workers);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async findWorkersByAccountId(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ accountId: z.string().uuid() }).parse(req.params);
      const workers = await this.findWorkerByAccountIdUseCase.execute(params.accountId);
      return reply.status(200).send(workers);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async findAllAssignments(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const assignments = await this.findAllWorkerAssignmentsUseCase.execute();
      return reply.status(200).send(assignments);
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async findAssignmentsByWorkerId(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ workerId: z.string().uuid() }).parse(req.params);
      const assignments = await this.findWorkerAssignmentsByWorkerIdUseCase.execute(params.workerId);
      return reply.status(200).send(assignments);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async findAssignmentsByCafeteriaId(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ cafeteriaId: z.string().uuid() }).parse(req.params);
      const assignments = await this.findWorkerAssignmentsByCafeteriaIdUseCase.execute(params.cafeteriaId);
      return reply.status(200).send(assignments);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }
}
