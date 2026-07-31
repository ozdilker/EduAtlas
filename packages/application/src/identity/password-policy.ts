import { WeakPasswordError } from "./errors";

/** SECURITY-ARCHITECTURE password policy (MVP): minimum length ≥ 10. */
export const MIN_PASSWORD_LENGTH = 10;

const TRIVIAL_PASSWORDS = new Set([
  "password",
  "password123",
  "1234567890",
  "qwertyuiop",
  "abcdefghij",
  "eduatlas12",
  "adminadmin",
]);

export function assertPasswordPolicy(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new WeakPasswordError(`Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`);
  }

  const normalized = password.trim().toLowerCase();
  if (TRIVIAL_PASSWORDS.has(normalized)) {
    throw new WeakPasswordError("Bu şifre yeterince güçlü değil. Lütfen farklı bir şifre seçin.");
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
