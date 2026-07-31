export type ProvisionOwnerAccountInput = {
  email: string;
  password: string;
  displayName?: string;
};

export type ProvisionOwnerAccountResult = Readonly<{
  readonly userId: string;
  readonly email: string;
  readonly created: boolean;
}>;

export type ChangeOwnerPasswordInput = {
  email: string;
  currentPassword: string;
  newPassword: string;
};

export type ChangeOwnerEmailInput = {
  currentEmail: string;
  newEmail: string;
  currentPassword: string;
};

/**
 * Admin-side Auth provisioning for claim approval (create/update user + owner role).
 */
export interface OwnerAccountProvisioner {
  provisionOwnerWithPassword(
    input: ProvisionOwnerAccountInput,
  ): Promise<ProvisionOwnerAccountResult>;
  changePassword(input: ChangeOwnerPasswordInput): Promise<void>;
  changeEmail(input: ChangeOwnerEmailInput): Promise<void>;
}
