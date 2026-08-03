"use server";

import { updateOrganizationContact } from "@eduatlas/application";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminPortalAccess } from "../auth/guards";
import { requireAdminSession } from "../auth/current-session";
import { getOrganizationContactRepository } from "../site/organization-contact-repository";

export async function updateAdminOrganizationContactAction(formData: FormData): Promise<void> {
  await assertAdminPortalAccess("/admin/site-contact");
  const session = await requireAdminSession();

  try {
    const organizationContactRepository = await getOrganizationContactRepository();
    await updateOrganizationContact(
      {
        displayName: String(formData.get("displayName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        streetAddress: String(formData.get("streetAddress") ?? ""),
        addressLocality: String(formData.get("addressLocality") ?? ""),
        addressRegion: String(formData.get("addressRegion") ?? ""),
        postalCode: String(formData.get("postalCode") ?? ""),
        updatedByUserId: session.user.uid,
      },
      { organizationContactRepository },
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? encodeURIComponent(error.message)
        : "save_failed";
    redirect(`/admin/site-contact?error=${message}`);
  }

  revalidatePath("/admin/site-contact");
  revalidatePath("/contact");
  revalidatePath("/");
  revalidatePath("/privacy");
  revalidatePath("/terms");
  revalidatePath("/kvkk");
  revalidatePath("/cookies");
  redirect("/admin/site-contact?saved=1");
}
