/**
 * Normalized Storage errors with stable codes and Turkish user-facing messages.
 */

export type StorageErrorCode =
  | "STORAGE_UNKNOWN"
  | "STORAGE_UNAUTHORIZED"
  | "STORAGE_FORBIDDEN"
  | "STORAGE_NOT_FOUND"
  | "STORAGE_CANCELED"
  | "STORAGE_RETRY_LIMIT"
  | "STORAGE_INVALID_ARGUMENT"
  | "STORAGE_QUOTA_EXCEEDED"
  | "STORAGE_SERVER";

export class StorageServiceError extends Error {
  readonly code: StorageErrorCode;
  readonly firebaseCode?: string;

  constructor(code: StorageErrorCode, message: string, firebaseCode?: string) {
    super(message);
    this.name = "StorageServiceError";
    this.code = code;
    this.firebaseCode = firebaseCode;
  }
}

export function isStorageServiceError(error: unknown): error is StorageServiceError {
  return error instanceof StorageServiceError;
}

type FirebaseLikeError = {
  readonly code?: string;
  readonly message?: string;
};

function asFirebaseLikeError(error: unknown): FirebaseLikeError | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    message: typeof candidate.message === "string" ? candidate.message : undefined,
  };
}

function normalizeFirebaseCode(code: string | undefined): string | undefined {
  if (!code) {
    return undefined;
  }
  return code.replace(/^storage\//, "");
}

/**
 * Maps Firebase Storage / unknown errors into StorageServiceError.
 */
export function mapStorageError(error: unknown): StorageServiceError {
  if (error instanceof StorageServiceError) {
    return error;
  }

  const firebase = asFirebaseLikeError(error);
  const firebaseCode = normalizeFirebaseCode(firebase?.code);

  switch (firebaseCode) {
    case "unauthenticated":
    case "unauthorized":
      return new StorageServiceError(
        "STORAGE_UNAUTHORIZED",
        "Dosya işlemi için oturum açmanız gerekiyor.",
        firebaseCode,
      );
    case "permission-denied":
      return new StorageServiceError(
        "STORAGE_FORBIDDEN",
        "Bu dosya işlemi için yetkiniz yok.",
        firebaseCode,
      );
    case "object-not-found":
      return new StorageServiceError(
        "STORAGE_NOT_FOUND",
        "İstenen dosya bulunamadı.",
        firebaseCode,
      );
    case "canceled":
      return new StorageServiceError(
        "STORAGE_CANCELED",
        "Dosya yükleme işlemi iptal edildi.",
        firebaseCode,
      );
    case "retry-limit-exceeded":
      return new StorageServiceError(
        "STORAGE_RETRY_LIMIT",
        "Dosya yükleme denemeleri tükendi. Lütfen tekrar deneyin.",
        firebaseCode,
      );
    case "invalid-argument":
      return new StorageServiceError(
        "STORAGE_INVALID_ARGUMENT",
        "Dosya yolu veya içeriği geçersiz.",
        firebaseCode,
      );
    case "quota-exceeded":
      return new StorageServiceError(
        "STORAGE_QUOTA_EXCEEDED",
        "Depolama kotası aşıldı.",
        firebaseCode,
      );
    case "server-file-wrong-size":
    case "unknown":
      return new StorageServiceError(
        "STORAGE_SERVER",
        "Dosya depolama servisinde bir hata oluştu.",
        firebaseCode,
      );
    default:
      return new StorageServiceError(
        "STORAGE_UNKNOWN",
        firebase?.message?.trim() || "Dosya depolama işlemi başarısız oldu.",
        firebaseCode,
      );
  }
}
