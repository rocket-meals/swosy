/**
 * Minimal, dependency free equivalent of "createError" from "@directus/errors".
 *
 * Directus only forwards status code and message of an error to the API client when it
 * recognizes the error as one of its own. Its check is purely name based
 * (see isDirectusError() in @directus/errors: `value.name === 'DirectusError'`).
 *
 * A plain `throw new Error(...)` inside a hook is therefore turned into a generic
 * HTTP 500 "An unexpected error occurred" and the user never learns why the request was
 * rejected. Errors created here keep their message and status code instead.
 */
export class MyDirectusError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly extensions: Record<string, unknown>;

  constructor(code: string, message: string, status: number, extensions: Record<string, unknown> = {}) {
    super(message);
    // Directus checks for exactly this name to treat the error as one of its own.
    this.name = 'DirectusError';
    this.code = code.toUpperCase();
    this.status = status;
    this.extensions = extensions;
  }

  toString(): string {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
}

/**
 * HTTP 403 - the request was understood but the user is not allowed to perform it.
 */
export function createMyForbiddenError(message: string, extensions: Record<string, unknown> = {}): MyDirectusError {
  return new MyDirectusError('FORBIDDEN', message, 403, extensions);
}
