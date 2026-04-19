import type { FastifyReply, FastifyRequest } from 'fastify';
import { FindAllProvidersUseCase } from '../../../../../core/application/use-cases/providers/find-all-providers.use-case';
import { FindProviderByAccountIdUseCase } from '../../../../../core/application/use-cases/providers/find-provider-by-account-id.use-case';
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
  constructor(
    private registerProviderUseCase: RegisterProviderUseCase,
    private findAllProvidersUseCase: FindAllProvidersUseCase,
    private findProviderByAccountIdUseCase: FindProviderByAccountIdUseCase,
  ) { }

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

  async findAllProviders(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const providers = await this.findAllProvidersUseCase.execute();
      return reply.status(200).send(providers);
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  }

  async findProviderByAccountId(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = z.object({ accountId: z.string().uuid() }).parse(req.params);
      const provider = await this.findProviderByAccountIdUseCase.execute(params.accountId);

      if (!provider) {
        return reply.status(404).send({ message: 'Provider not found' });
      }

      return reply.status(200).send(provider);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send(error.flatten());
      return reply.status(400).send({ message: (error as Error).message });
    }
  }
}
