// ────────────────────────────────────────────────────────────
// Structured error hierarchy
// ────────────────────────────────────────────────────────────
//
// All errors thrown by the KWI package derive from `WeatherProviderError`
// so consumers can catch the entire family with a single `instanceof` check
// without also catching unrelated `Error` subtypes from their own code.
//
// Usage:
//   try {
//     const result = await kwi.analyze(input);
//   } catch (err) {
//     if (err instanceof InvalidLocationError) { … }
//     else if (err instanceof WeatherTimeoutError) { … }
//     else if (err instanceof WeatherProviderError) { /* catch-all for KWI errors */ }
//     else throw err; // re-throw non-KWI errors
//   }

/** Base class for all KWI package errors. */
export class WeatherProviderError extends Error {
  readonly code: string;
  readonly provider?: string;
  readonly cause?: unknown;

  constructor(message: string, options?: { code?: string; provider?: string; cause?: unknown }) {
    super(message);
    this.name = this.constructor.name;
    this.code = options?.code ?? 'WEATHER_PROVIDER_ERROR';
    this.provider = options?.provider;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
    // Restore prototype chain (needed when targeting ES5, harmless on ES2022)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when location coordinates are out of valid range. */
export class InvalidLocationError extends WeatherProviderError {
  readonly latitude?: number;
  readonly longitude?: number;

  constructor(message: string, options?: { latitude?: number; longitude?: number }) {
    super(message, { code: 'INVALID_LOCATION', ...options });
    this.latitude = options?.latitude;
    this.longitude = options?.longitude;
  }
}

/** Thrown when the weather provider does not respond within the timeout. */
export class WeatherTimeoutError extends WeatherProviderError {
  readonly timeoutMs: number;

  constructor(message: string, options: { timeoutMs: number; provider?: string }) {
    super(message, { code: 'WEATHER_TIMEOUT', ...options });
    this.timeoutMs = options.timeoutMs;
  }
}

/** Thrown when the provider returns an HTTP error status. */
export class WeatherApiError extends WeatherProviderError {
  readonly statusCode: number;

  constructor(message: string, options: { statusCode: number; provider?: string }) {
    super(message, { code: 'WEATHER_API_ERROR', ...options });
    this.statusCode = options.statusCode;
  }
}

/** Thrown when createWeatherAdapter receives an unsupported provider id. */
export class UnknownProviderError extends WeatherProviderError {
  readonly providerId: string;

  constructor(providerId: string) {
    super(
      `Unknown weather provider: '${providerId}'. Supported: 'open-meteo'.`,
      { code: 'UNKNOWN_PROVIDER', provider: providerId },
    );
    this.providerId = providerId;
  }
}

/** Thrown when input validation fails (bad date format, unknown cropId, etc.). */
export class ValidationError extends WeatherProviderError {
  readonly field: string;

  constructor(field: string, message: string) {
    super(`${field}: ${message}`, { code: 'VALIDATION_ERROR' });
    this.field = field;
  }
}
