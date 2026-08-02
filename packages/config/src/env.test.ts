import { describe, expect, it } from "vitest";
import { getPublicEnv, getServerEnv } from "./env";

describe("env", () => {
  it("applies public defaults", () => {
    const env = getPublicEnv({});

    expect(env.NEXT_PUBLIC_APP_NAME).toBe("EduAtlas");
    expect(env.NEXT_PUBLIC_APP_URL).toBeUndefined();
  });

  it("parses a valid public app URL", () => {
    const env = getPublicEnv({
      NEXT_PUBLIC_APP_NAME: "EduAtlas",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });

    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("parses server environment values", () => {
    const env = getServerEnv({
      NODE_ENV: "test",
      NEXT_PUBLIC_APP_NAME: "EduAtlas",
      EDUATLAS_ALLOW_ROBOTS: "true",
    });

    expect(env.NODE_ENV).toBe("test");
    expect(env.EDUATLAS_ALLOW_ROBOTS).toBe("true");
  });
});
