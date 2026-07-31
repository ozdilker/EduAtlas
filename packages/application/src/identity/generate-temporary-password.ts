import { randomBytes } from "node:crypto";
import { MIN_PASSWORD_LENGTH } from "./password-policy";

/**
 * Generates a temporary password that satisfies MVP password policy.
 */
export function generateTemporaryOwnerPassword(length = 14): string {
  const size = Math.max(length, MIN_PASSWORD_LENGTH);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%";
  const bytes = randomBytes(size);
  let password = "";
  for (let index = 0; index < size; index += 1) {
    password += alphabet[bytes[index]! % alphabet.length];
  }
  // Ensure mixed classes for trivial-set avoidance.
  if (!/[A-Z]/.test(password)) password = `A${password.slice(1)}`;
  if (!/[a-z]/.test(password)) password = `${password.slice(0, 1)}a${password.slice(2)}`;
  if (!/[0-9]/.test(password)) password = `${password.slice(0, 2)}7${password.slice(3)}`;
  if (!/[!@$%]/.test(password)) password = `${password.slice(0, 3)}!${password.slice(4)}`;
  return password;
}
