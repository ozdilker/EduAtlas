"use server";

import {
  isInvalidCredentialsError,
  isWeakPasswordError,
  MIN_PASSWORD_LENGTH,
} from "@eduatlas/application";
import { getOwnerAccountProvisioner } from "@/server/auth/owner-account-provisioner";
import { requireOwnerContext } from "@/server/owner/require-owner-context";

export type ChangeOwnerPasswordState = {
  ok: boolean;
  message: string;
};

/**
 * Owner portal: change Auth password (current password required).
 */
export async function changeOwnerPasswordAction(
  _prevState: ChangeOwnerPasswordState,
  formData: FormData,
): Promise<ChangeOwnerPasswordState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword) {
    return { ok: false, message: "Mevcut ve yeni şifre zorunludur." };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, message: "Yeni şifre ile tekrarı eşleşmiyor." };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`,
    };
  }

  try {
    const { user } = await requireOwnerContext();
    const provisioner = await getOwnerAccountProvisioner();
    await provisioner.changePassword({
      email: user.email,
      currentPassword,
      newPassword,
    });
    return { ok: true, message: "Şifreniz güncellendi." };
  } catch (error) {
    if (isInvalidCredentialsError(error)) {
      return { ok: false, message: "Mevcut şifre hatalı." };
    }
    if (isWeakPasswordError(error)) {
      return { ok: false, message: error.message };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Şifre güncellenemedi.",
    };
  }
}
