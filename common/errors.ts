export class JFrogError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly response: unknown
    ) {
      super(message);
      this.name = "JFrogError";
    }
  }
  
  export class JFrogValidationError extends JFrogError {
    constructor(message: string, status: number, response: unknown) {
      super(message, status, response);
      this.name = "JFrogValidationError";
    }
  }
  
  export class JFrogResourceNotFoundError extends JFrogError {
    constructor(resource: string) {
      super(`Resource not found: ${resource}`, 404, { message: `${resource} not found` });
      this.name = "JFrogResourceNotFoundError";
    }
  }
  
  export class JFrogAuthenticationError extends JFrogError {
    constructor(message = "Authentication failed") {
      super(message, 401, { message });
      this.name = "JFrogAuthenticationError";
    }
  }
  
  export class JFrogPermissionError extends JFrogError {
    constructor(message = "Insufficient permissions") {
      super(message, 403, { message });
      this.name = "JFrogPermissionError";
    }
  }
  
  export class JFrogRateLimitError extends JFrogError {
    constructor(
      message = "Rate limit exceeded",
      public readonly resetAt: Date
    ) {
      super(message, 429, { message, reset_at: resetAt.toISOString() });
      this.name = "JFrogRateLimitError";
    }
  }
  
  export class JFrogConflictError extends JFrogError {
    constructor(message: string) {
      super(message, 409, { message });
      this.name = "JFrogConflictError";
    }
  }
  
  export function isJFrogError(error: unknown): error is JFrogError {
    return error instanceof JFrogError;
  }
  
  export function createJFrogError(status: number, response: any): JFrogError {
    switch (status) {
      case 401:
        return new JFrogAuthenticationError(response?.message);
      case 403:
        return new JFrogPermissionError(response?.message);
      case 404:
        return new JFrogResourceNotFoundError(response?.message || "Resource");
      case 409:
        return new JFrogConflictError(response?.message || "Conflict occurred");
      case 422:
        return new JFrogValidationError(
          response?.message || "Validation failed",
          status,
          response
        );
      case 429:
        return new JFrogRateLimitError(
          response?.message,
          new Date(response?.reset_at || Date.now() + 60000)
        );
        case 500:
            return new JFrogResourceNotFoundError(response?.message || "Resource");
      default:
        return new JFrogError(
          response?.message || "JFrog API error",
          status,
          response
        );
    }
  }