export type PaytrEnv = {
  readonly merchantId: string;
  readonly merchantKey: string;
  readonly merchantSalt: string;
  readonly testMode: "0" | "1";
  readonly debugOn: "0" | "1";
};

export function isPaytrConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.PAYTR_MERCHANT_ID?.trim() &&
      env.PAYTR_MERCHANT_KEY?.trim() &&
      env.PAYTR_MERCHANT_SALT?.trim(),
  );
}

export function getPaytrEnv(env: NodeJS.ProcessEnv = process.env): PaytrEnv {
  if (!isPaytrConfigured(env)) {
    throw new Error("PayTR is not configured.");
  }
  const testMode = env.PAYTR_TEST_MODE === "0" ? "0" : "1";
  const debugOn =
    env.PAYTR_DEBUG_ON === "0" ? "0" : env.PAYTR_DEBUG_ON === "1" ? "1" : testMode;
  return {
    merchantId: env.PAYTR_MERCHANT_ID!.trim(),
    merchantKey: env.PAYTR_MERCHANT_KEY!.trim(),
    merchantSalt: env.PAYTR_MERCHANT_SALT!.trim(),
    testMode,
    debugOn,
  };
}
