import { InstitutionSort } from "@eduatlas/application";
import {
  AppRole,
  createInstitutionId,
  type CurrentUser,
  InstitutionStatus,
  institutionIdAsString,
} from "@eduatlas/domain";
import { redirect } from "next/navigation";
import { requireOwnerSession } from "../auth/current-session";
import { resolveAuthenticatedOwnerInstitutionId } from "../auth/owner-binding";
import { getInstitutionRepository } from "../institutions/repository";

export type OwnerRequestContext = Readonly<{
  readonly user: CurrentUser;
  readonly institutionId: string;
}>;

/**
 * Server AuthZ gate for owner mutations/views: verified session + institution scope.
 * Does not auto-bind; unbound / missing institutions go to onboarding (never 404).
 * In development, admins without a binding can open the portal against a published institution.
 */
export async function requireOwnerContext(): Promise<OwnerRequestContext> {
  const session = await requireOwnerSession();
  let institutionId = await resolveAuthenticatedOwnerInstitutionId(session.user.uid);

  if (
    !institutionId &&
    session.user.role === AppRole.Admin &&
    process.env.NODE_ENV !== "production"
  ) {
    institutionId = await resolveFirstPublishedInstitutionId();
  }

  if (!institutionId) {
    redirect("/owner/onboarding?reason=unbound");
  }

  try {
    const institutionRepository = await getInstitutionRepository();
    const institution = await institutionRepository.getById(createInstitutionId(institutionId));

    if (!institution) {
      redirect("/owner/onboarding?reason=missing_institution");
    }

    return Object.freeze({
      user: session.user,
      institutionId: institutionIdAsString(institution.id),
    });
  } catch {
    redirect("/owner/onboarding?reason=missing_institution");
  }
}

async function resolveFirstPublishedInstitutionId(): Promise<string | null> {
  try {
    const institutionRepository = await getInstitutionRepository();
    const page = await institutionRepository.list({
      page: 1,
      pageSize: 1,
      sort: InstitutionSort.NameAsc,
      filters: { status: InstitutionStatus.Published },
    });
    const first = page.items[0];
    return first ? institutionIdAsString(first.id) : null;
  } catch {
    return null;
  }
}
