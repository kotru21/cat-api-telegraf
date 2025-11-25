export class AppError extends Error {
  public code: string;
  public status: number;
  public cause?: unknown;

  constructor(
    message: string,
    {
      code = 'APP_ERROR',
      status = 500,
      cause,
    }: { code?: string; status?: number; cause?: unknown } = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    if (cause) this.cause = cause;
  }
}

export class ValidationError extends AppError {
  public details: unknown;

  constructor(message: string, details?: unknown) {
    super(message, { code: 'VALIDATION_ERROR', status: 400 });
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, { code: 'NOT_FOUND', status: 404 });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, { code: 'UNAUTHORIZED', status: 401 });
  }
}
