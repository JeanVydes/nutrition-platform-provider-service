export interface PaginationParams {
    page: number;
    batchSize: number;
}

export interface PaginatedResult<T> {
    data: T[];
    page: number;
    batchSize: number;
    total: number;
    totalPages: number;
}

export function buildPaginatedResult<T>(
    data: T[],
    total: number,
    params: PaginationParams,
): PaginatedResult<T> {
    return {
        data,
        page: params.page,
        batchSize: params.batchSize,
        total,
        totalPages: Math.ceil(total / params.batchSize),
    };
}

export function toOffset(params: PaginationParams): { limit: number; offset: number } {
    return {
        limit: params.batchSize,
        offset: (params.page - 1) * params.batchSize,
    };
}
