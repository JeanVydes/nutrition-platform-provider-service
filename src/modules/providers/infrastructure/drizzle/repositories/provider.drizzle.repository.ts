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
                pais: provider.pais,
                ciudad: provider.ciudad,
                billingAddress: provider.billingAddress,
                oficina: provider.oficina,
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
            row.createdAt ?? null,
            row.pais ?? null,
            row.ciudad ?? null,
            row.billingAddress ?? null,
            row.oficina ?? null
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
            row.createdAt ?? null,
            row.pais ?? null,
            row.ciudad ?? null,
            row.billingAddress ?? null,
            row.oficina ?? null
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
            row.createdAt ?? null,
            row.pais ?? null,
            row.ciudad ?? null,
            row.billingAddress ?? null,
            row.oficina ?? null
        );
    }

    async findAll(): Promise<Provider[]> {
        const rows = await db
            .select()
            .from(providers);

        return rows.map((row) => new Provider(
            row.id,
            row.accountId,
            row.name,
            row.companyRegistration ?? null,
            row.contactEmail ?? null,
            row.contactPhone ?? null,
            row.createdAt ?? null,
            row.pais ?? null,
            row.ciudad ?? null,
            row.billingAddress ?? null,
            row.oficina ?? null
        ));
    }

    async update(id: string, provider: Partial<Omit<Provider, "id" | "createdAt">>): Promise<Provider | null> {
        const values: Partial<{
            accountId: string;
            name: string;
            companyRegistration: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            pais?: string | null;
            ciudad?: string | null;
            billingAddress?: string | null;
            oficina?: string | null;
        }> = {
            accountId: provider.accountId,
            name: provider.name,
            companyRegistration: provider.companyRegistration,
            contactEmail: provider.contactEmail,
            contactPhone: provider.contactPhone,
            pais: provider.pais,
            ciudad: provider.ciudad,
            billingAddress: provider.billingAddress,
            oficina: provider.oficina,
        };

        Object.keys(values).forEach((key) => {
            if (values[key as keyof typeof values] === undefined) {
                delete values[key as keyof typeof values];
            }
        });

        if (Object.keys(values).length === 0) {
            return this.findById(id);
        }

        const [row] = await db
            .update(providers)
            .set(values)
            .where(eq(providers.id, id))
            .returning();

        if (!row) return null;

        return new Provider(
            row.id,
            row.accountId,
            row.name,
            row.companyRegistration ?? null,
            row.contactEmail ?? null,
            row.contactPhone ?? null,
            row.createdAt ?? null,
            row.pais ?? null,
            row.ciudad ?? null,
            row.billingAddress ?? null,
            row.oficina ?? null
        );
    }

    async deleteById(id: string): Promise<boolean> {
        const [row] = await db
            .delete(providers)
            .where(eq(providers.id, id))
            .returning({ id: providers.id });

        return Boolean(row);
    }
}
