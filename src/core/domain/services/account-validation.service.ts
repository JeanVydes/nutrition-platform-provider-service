export interface IAccountValidationService {
    ensureAccountExists(accountId: string): Promise<void>;
}
