import {
  getFirebaseClientConfig,
  getFirebaseEmulatorConfig,
  getFirebasePublicEnv,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";

export type IdentityToolkitSignInResponse = {
  idToken: string;
  refreshToken?: string;
  localId: string;
  email: string;
  expiresIn?: string;
  displayName?: string;
  registered?: boolean;
};

export type IdentityToolkitErrorBody = {
  error?: {
    message?: string;
    code?: number;
  };
};

/**
 * Server-side Identity Toolkit REST client (no Firebase JS Auth in UI).
 */
export class IdentityToolkitClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options?: { apiKey?: string; baseUrl?: string }) {
    const env = getFirebasePublicEnv();
    const config = getFirebaseClientConfig(env);
    this.apiKey = options?.apiKey ?? config.apiKey;

    if (options?.baseUrl) {
      this.baseUrl = options.baseUrl;
    } else if (shouldUseFirebaseEmulators(env)) {
      const emulator = getFirebaseEmulatorConfig(env);
      this.baseUrl = `http://${emulator.host}:${emulator.authPort}/identitytoolkit.googleapis.com/v1`;
    } else {
      this.baseUrl = "https://identitytoolkit.googleapis.com/v1";
    }
  }

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<IdentityToolkitSignInResponse> {
    return this.post<IdentityToolkitSignInResponse>("accounts:signInWithPassword", {
      email,
      password,
      returnSecureToken: true,
    });
  }

  async signUp(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<IdentityToolkitSignInResponse> {
    return this.post<IdentityToolkitSignInResponse>("accounts:signUp", {
      email,
      password,
      displayName,
      returnSecureToken: true,
    });
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    await this.post("accounts:sendOobCode", {
      requestType: "PASSWORD_RESET",
      email,
    });
  }

  async sendEmailVerification(idToken: string): Promise<void> {
    await this.post("accounts:sendOobCode", {
      requestType: "VERIFY_EMAIL",
      idToken,
    });
  }

  async lookupAccount(idToken: string): Promise<{
    localId: string;
    email: string;
    emailVerified: boolean;
    displayName?: string;
    customAttributes?: string;
  }> {
    const response = await this.post<{
      users?: Array<{
        localId: string;
        email?: string;
        emailVerified?: boolean;
        displayName?: string;
        customAttributes?: string;
      }>;
    }>("accounts:lookup", { idToken });

    const user = response.users?.[0];
    if (!user?.localId || !user.email) {
      throw new Error("IDENTITY_TOOLKIT_LOOKUP_FAILED");
    }

    return {
      localId: user.localId,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      displayName: user.displayName,
      customAttributes: user.customAttributes,
    };
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}/${path}?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as T & IdentityToolkitErrorBody;
    if (!response.ok) {
      const message = payload.error?.message ?? `IDENTITY_TOOLKIT_${response.status}`;
      throw new IdentityToolkitRequestError(message);
    }
    return payload;
  }
}

export class IdentityToolkitRequestError extends Error {
  constructor(readonly firebaseCode: string) {
    super(firebaseCode);
    this.name = "IdentityToolkitRequestError";
  }
}

export function createIdentityToolkitClient(options?: {
  apiKey?: string;
  baseUrl?: string;
}): IdentityToolkitClient {
  return new IdentityToolkitClient(options);
}
