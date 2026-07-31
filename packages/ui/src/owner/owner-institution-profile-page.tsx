import type { ReactNode } from "react";
import { Container } from "../components/container";
import type {
  OwnerInstitutionProfileFormState,
  OwnerInstitutionProfilePageViewData,
} from "./owner-institution-profile-content";
import { OwnerInstitutionProfileForm } from "./owner-institution-profile-form";
import { OwnerPortalShell } from "./owner-portal-shell";

export type OwnerInstitutionProfilePageProps = {
  data: OwnerInstitutionProfilePageViewData;
  action: (
    prevState: OwnerInstitutionProfileFormState,
    formData: FormData,
  ) => Promise<OwnerInstitutionProfileFormState>;
  logoField?: ReactNode;
  coverField?: ReactNode;
  galleryField?: ReactNode;
  brochureField?: ReactNode;
  className?: string;
};

/**
 * Owner profile management page — repository-backed edits only.
 */
export function OwnerInstitutionProfilePage({
  data,
  action,
  logoField,
  coverField,
  galleryField,
  brochureField,
  className,
}: OwnerInstitutionProfilePageProps) {
  return (
    <OwnerPortalShell
      institutionName={data.form.institutionName}
      institutionLogoUrl={data.form.logoUrl}
      activeTab="profile"
      className={className}
    >
      <Container size="xl" className="ea-owner-portal">
        <header className="ea-owner-portal__hero">
          <p className="ea-owner-portal__eyebrow">Kurum paneli</p>
          <h1 className="ea-owner-portal__title">Profil yönetimi</h1>
          <p className="ea-owner-portal__description">
            Yayınlanan iletişim ve açıklama alanlarını güncelleyin. Değişiklikler onay beklemeden
            genel profile yansır.
          </p>
        </header>

        <OwnerInstitutionProfileForm
          values={data.form}
          action={action}
          logoField={logoField}
          coverField={coverField}
          galleryField={galleryField}
          brochureField={brochureField}
        />
      </Container>
    </OwnerPortalShell>
  );
}
