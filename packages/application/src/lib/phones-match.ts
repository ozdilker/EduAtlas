function digitsOnly(value: string | undefined): string {
  return (value ?? "").replace(/\D+/g, "");
}

export function phonesMatch(a: string | undefined, b: string | undefined): boolean {
  const left = digitsOnly(a);
  const right = digitsOnly(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const leftTail = left.slice(-10);
  const rightTail = right.slice(-10);
  return leftTail.length >= 7 && leftTail === rightTail;
}
