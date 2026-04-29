export interface IAccountValidationService {
    ensureAccountExists(accountId: string, accessToken?: string): Promise<void>;
}
