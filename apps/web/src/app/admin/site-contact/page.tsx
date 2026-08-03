import { AdminSiteContactPage } from "@eduatlas/ui";
import { updateAdminOrganizationContactAction } from "@/server/admin/organization-contact-action";
import { assertAdminPortalAccess } from "@/server/auth/guards";
import { getPublicOrganizationContact } from "@/server/site/get-public-organization-contact";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminSiteContactRoute({ searchParams }: PageProps) {
  await assertAdminPortalAccess("/admin/site-contact");
  const params = await searchParams;
  const contact = await getPublicOrganizationContact();

  return (
    <AdminSiteContactPage
      values={{
        displayName: contact.displayName,
        email: contact.email,
        phone: contact.phone,
        streetAddress: contact.streetAddress,
        addressLocality: contact.addressLocality,
        addressRegion: contact.addressRegion,
        postalCode: contact.postalCode,
      }}
      updateAction={updateAdminOrganizationContactAction}
      {...(params.saved === "1" ? { statusMessage: "İletişim bilgileri kaydedildi." } : {})}
      {...(params.error
        ? { errorMessage: decodeURIComponent(params.error) }
        : {})}
    />
  );
}
