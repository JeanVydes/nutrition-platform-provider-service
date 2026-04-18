import type { FastifyReply, FastifyRequest } from 'fastify';
import { RegisterProviderUseCase } from '../../../../../core/application/use-cases/providers/register-provider.use-case';
import { z } from 'zod';

export const registerProviderSchema = z.object({
  accountId: z.string().uuid(),
  name: z.string().min(1),
  companyRegistration: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export class ProviderController {
  constructor(private registerProviderUseCase: RegisterProviderUseCase) { }

  async registerProvider(req: FastifyRequest, reply: FastifyReply) {
    try {
      const data = registerProviderSchema.parse(req.body);
      const provider = await this.registerProviderUseCase.execute(data);
      return reply.status(201).send(provider);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }
}
