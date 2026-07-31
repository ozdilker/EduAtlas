import type { AppEnvironment } from "@eduatlas/types";
import { z } from "zod";

const appEnvironmentSchema = z.enum(["development", "test", "production"]);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("EduAtlas"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const serverEnvSchema = publicEnvSchema.extend({
  NODE_ENV: appEnvironmentSchema.default("development"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema> & {
  NODE_ENV: AppEnvironment;
};

function readPublicEnvFromProcess(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };
}

function readServerEnvFromProcess(): Record<string, string | undefined> {
  return {
    ...readPublicEnvFromProcess(),
    NODE_ENV: process.env.NODE_ENV,
  };
}

/**
 * Validates public (browser-safe) environment variables.
 */
export function getPublicEnv(
  source: Record<string, string | undefined> = readPublicEnvFromProcess(),
): PublicEnv {
  return publicEnvSchema.parse(source);
}

/**
 * Validates server-side environment variables.
 */
export function getServerEnv(
  source: Record<string, string | undefined> = readServerEnvFromProcess(),
): ServerEnv {
  return serverEnvSchema.parse(source) as ServerEnv;
}
