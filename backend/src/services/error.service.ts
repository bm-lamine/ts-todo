export type Failure = {
  path?: PropertyKey[];
  message: string;
};

export default class ErrorService {
  private readonly _errors: readonly Failure[];

  // Set a default status (400) so the constructor is always satisfied
  private constructor(errors: Failure[]) {
    this._errors = Object.freeze(errors);
  }

  /** Static helper to initialize from an array */
  static from(errors: Failure[]): ErrorService {
    return new ErrorService(errors);
  }

  /** Helper to create a factory from a single error */
  static single(message: string, path?: PropertyKey[]): ErrorService {
    return new ErrorService([{ message, path }]);
  }

  get errors(): readonly Failure[] {
    return this._errors;
  }

  toJSON() {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      errors: this._errors.map((err) => ({
        ...err,
        path: err.path,
        // Helper for frontend developers to avoid parsing arrays
        pathString: err.path?.join("."),
      })),
    };
  }
}
