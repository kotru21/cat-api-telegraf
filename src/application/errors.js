export class AppError extends Error {
  constructor(message, { code = "APP_ERROR", status = 500, cause } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    if (cause) this.cause = cause;
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, { code: "VALIDATION_ERROR", status: 400 });
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, { code: "NOT_FOUND", status: 404 });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, { code: "UNAUTHORIZED", status: 401 });
  }
}
