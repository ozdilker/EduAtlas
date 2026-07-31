export type AuthenticationErrorCode =
  | "AUTHENTICATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "EMAIL_ALREADY_IN_USE"
  | "WEAK_PASSWORD"
  | "SESSION_EXPIRED"
  | "UNAUTHORIZED"
  | "EMAIL_NOT_VERIFIED";

export class AuthenticationError extends Error {
  readonly code: AuthenticationErrorCode = "AUTHENTICATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  override readonly code = "INVALID_CREDENTIALS" as const;

  constructor(message = "Email veya şifre hatalı.") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

export class EmailAlreadyInUseError extends AuthenticationError {
  override readonly code = "EMAIL_ALREADY_IN_USE" as const;

  constructor(message = "Bu e-posta adresi zaten kayıtlı.") {
    super(message);
    this.name = "EmailAlreadyInUseError";
  }
}

export class WeakPasswordError extends AuthenticationError {
  override readonly code = "WEAK_PASSWORD" as const;

  constructor(message = "Şifre en az 10 karakter olmalıdır.") {
    super(message);
    this.name = "WeakPasswordError";
  }
}

export class SessionExpiredError extends AuthenticationError {
  override readonly code = "SESSION_EXPIRED" as const;

  constructor(message = "Oturum süresi doldu. Lütfen yeniden giriş yapın.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export class UnauthorizedError extends AuthenticationError {
  override readonly code = "UNAUTHORIZED" as const;

  constructor(message = "Bu işlem için yetkiniz yok.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class EmailNotVerifiedError extends AuthenticationError {
  override readonly code = "EMAIL_NOT_VERIFIED" as const;

  constructor(message = "Devam etmek için e-posta adresinizi doğrulayın.") {
    super(message);
    this.name = "EmailNotVerifiedError";
  }
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isInvalidCredentialsError(error: unknown): error is InvalidCredentialsError {
  return error instanceof InvalidCredentialsError;
}

export function isEmailAlreadyInUseError(error: unknown): error is EmailAlreadyInUseError {
  return error instanceof EmailAlreadyInUseError;
}

export function isWeakPasswordError(error: unknown): error is WeakPasswordError {
  return error instanceof WeakPasswordError;
}

export function isSessionExpiredError(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError;
}

export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

export function isEmailNotVerifiedError(error: unknown): error is EmailNotVerifiedError {
  return error instanceof EmailNotVerifiedError;
}
