function keepLeadingLetters(namePart: string, keep = 1): string {
  const chars = [...namePart];
  if (chars.length === 0) return "";
  const visible = chars.slice(0, Math.min(keep, chars.length)).join("");
  const hidden = Math.max(0, chars.length - visible.length);
  return visible + "*".repeat(Math.min(hidden, 8));
}

/**
 * "Ahmet Yılmaz" → "Ahmet Y*****"
 */
export function maskPersonName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "*****";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "*****";
  if (parts.length === 1) {
    return keepLeadingLetters(parts[0] ?? "", 2);
  }
  const first = parts[0] ?? "";
  const last = parts[parts.length - 1] ?? "";
  const middle = parts.slice(1, -1).map((p) => keepLeadingLetters(p, 1));
  return [first, ...middle, keepLeadingLetters(last, 1)].join(" ");
}

/**
 * "05321234567" → "05********"
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) {
    return "*".repeat(8);
  }
  const prefix = digits.slice(0, 2);
  return `${prefix}${"*".repeat(Math.min(8, Math.max(4, digits.length - 2)))}`;
}

/**
 * "ahmet@gmail.com" → "ah****@gmail.com"
 */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) {
    return "****@****";
  }
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}****@${domain || "****"}`;
}

export function maskMessage(_message: string): string {
  return "••••••••••••••••••••";
}
