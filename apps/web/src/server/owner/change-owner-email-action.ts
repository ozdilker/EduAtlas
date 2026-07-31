"use server";

import {
  isEmailAlreadyInUseError,
  isInvalidCredentialsError,
  isValidEmailFormat,
  normalizeEmail,
} from "@eduatlas/application";
import { getOwnerAccountProvisioner } from "@/server/auth/owner-account-provisioner";
import { requireOwnerContext } from "@/server/owner/require-owner-context";

export type ChangeOwnerEmailState = {
  ok: boolean;
  message: string;
};

/**
 * Owner portal: change Auth login email (current password required).
 */
export async function changeOwnerEmailAction(
  _prevState: ChangeOwnerEmailState,
  formData: FormData,
): Promise<ChangeOwnerEmailState> {
  const newEmail = String(formData.get("newEmail") ?? "");
  const confirmEmail = String(formData.get("confirmEmail") ?? "");
  const currentPassword = String(formData.get("currentPassword") ?? "");

  if (!newEmail || !confirmEmail || !currentPassword) {
    return { ok: false, message: "Yeni e-posta, tekrarı ve mevcut şifre zorunludur." };
  }
  if (normalizeEmail(newEmail) !== normalizeEmail(confirmEmail)) {
    return { ok: false, message: "Yeni e-posta ile tekrarı eşleşmiyor." };
  }
  if (!isValidEmailFormat(normalizeEmail(newEmail))) {
    return { ok: false, message: "Geçerli bir e-posta adresi girin." };
  }

  try {
    const { user } = await requireOwnerContext();
    const provisioner = await getOwnerAccountProvisioner();
    await provisioner.changeEmail({
      currentEmail: user.email,
      newEmail,
      currentPassword,
    });
    return {
      ok: true,
      message: "Giriş e-postanız güncellendi. Bundan sonra yeni adresinizle giriş yapın.",
    };
  } catch (error) {
    if (isInvalidCredentialsError(error)) {
      return { ok: false, message: error.message };
    }
    if (isEmailAlreadyInUseError(error)) {
      return { ok: false, message: "Bu e-posta adresi zaten kayıtlı." };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "E-posta güncellenemedi.",
    };
  }
}
