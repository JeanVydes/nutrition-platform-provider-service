export class AppError extends Error {
    constructor(
        message: string,
        public readonly code: string,
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ValidationError extends AppError {
    constructor(
        public readonly field: string,
        message: string,
        code = "VALIDATION_ERROR",
        public readonly promptedValue?: unknown,
        public readonly expectedFormat?: string,
    ) {
        super(message, code);
    }
}

export class InvalidUuidError extends ValidationError {
    constructor(field: string, value: unknown) {
        super(
            field,
            `'${value}' is not a valid UUID`,
            "INVALID_UUID",
            value,
            "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        );
    }
}