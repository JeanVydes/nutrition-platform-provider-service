import { eq } from "drizzle-orm";

import { Provider } from "@/core/domain/entities/provider.entity.js";
import type { IProviderRepository } from "@/core/domain/repositories/provider.repository.js";
import { db } from "@/shared/database/connection.js";
import { providers } from "@/shared/database/schema.js";

export class ProviderDrizzleRepository implements IProviderRepository {
    async create(provider: Omit<Provider, "id" | "createdAt">): Promise<Provider> {
        const [row] = await db
            .insert(providers)
            .values({
                accountId: provider.accountId,
                name: provider.name,
                companyRegistration: provider.companyRegistration,
                contactEmail: provider.contactEmail,
                contactPhone: provider.contactPhone,
            })
            .returning();

        if (!row) {
            throw new Error("Provider could not be created");
        }

        return new Provider(
            row.id,
            row.accountId,
            row.name,
            row.companyRegistration ?? null,
            row.contactEmail ?? null,
            row.contactPhone ?? null,
            row.createdAt ?? null
        );
    }

    async findById(id: string): Promise<Provider | null> {
        const [row] = await db
            .select()
            .from(providers)
            .where(eq(providers.id, id))
            .limit(1);

        if (!row) return null;

        return new Provider(
            row.id,
            row.accountId,
            row.name,
            row.companyRegistration ?? null,
            row.contactEmail ?? null,
            row.contactPhone ?? null,
            row.createdAt ?? null
        );
    }

    async findByAccountId(accountId: string): Promise<Provider | null> {
        const [row] = await db
            .select()
            .from(providers)
            .where(eq(providers.accountId, accountId))
            .limit(1);

        if (!row) return null;

        return new Provider(
            row.id,
            row.accountId,
            row.name,
            row.companyRegistration ?? null,
            row.contactEmail ?? null,
            row.contactPhone ?? null,
            row.createdAt ?? null
        );
    }
}
