import type { CampaignSegment, Institution } from "@eduatlas/domain";
import { institutionIdAsString } from "@eduatlas/domain";
import { assertOperationAllowed, type BillingProtectionRepository } from "../billing-protection";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { CampaignSegmentRepository } from "./campaign-segment-repository";
import { institutionMatchesSegment } from "./institution-matches-segment";

export type SegmentInstitutionPreview = Readonly<{
  readonly institutionId: string;
  readonly name: string;
  readonly cityId: string;
  readonly email: string;
}>;

export type PreviewSegmentInstitutionsResult = Readonly<{
  readonly matchCount: number;
  readonly items: readonly SegmentInstitutionPreview[];
}>;

export type PreviewSegmentInstitutionsDependencies = Readonly<{
  readonly segmentRepository: CampaignSegmentRepository;
  readonly institutionRepository: InstitutionRepository;
  /** Optional Phase 1 billing circuit breaker — fail-open when omitted. */
  readonly billingProtectionRepository?: BillingProtectionRepository | null;
}>;

function toPreview(inst: Institution): SegmentInstitutionPreview {
  return Object.freeze({
    institutionId: institutionIdAsString(inst.id),
    name: inst.name,
    cityId: inst.location.cityId,
    email: inst.contact.email?.trim() ?? "",
  });
}

async function listMatchedInstitutions(
  segment: CampaignSegment,
  deps: PreviewSegmentInstitutionsDependencies,
): Promise<readonly Institution[]> {
  await assertOperationAllowed("OUTREACH_PREPARE", {
    billingProtectionRepository: deps.billingProtectionRepository,
  });

  const page = await deps.institutionRepository.list({
    filters: {
      ...(segment.filters.cityId ? { cityId: segment.filters.cityId } : {}),
      ...(segment.filters.districtId ? { districtId: segment.filters.districtId } : {}),
      ...(segment.filters.primaryType
        ? { primaryType: segment.filters.primaryType as Institution["primaryType"] }
        : {}),
      ...(segment.filters.verification
        ? { verification: segment.filters.verification as Institution["verification"] }
        : {}),
    },
    pageSize: 500,
  });
  return page.items.filter((inst) => institutionMatchesSegment(inst, segment));
}

/**
 * Counts institutions matching a segment (prepare preview; no side effects).
 */
export async function countSegmentMatches(
  segmentId: string,
  deps: PreviewSegmentInstitutionsDependencies,
): Promise<number> {
  const segment = await deps.segmentRepository.getById(segmentId.trim());
  if (!segment) return 0;
  const matched = await listMatchedInstitutions(segment, deps);
  return matched.length;
}

/**
 * Returns match count + sample rows for wizard recipient preview.
 */
export async function previewSegmentInstitutions(
  input: { segmentId: string; limit?: number },
  deps: PreviewSegmentInstitutionsDependencies,
): Promise<PreviewSegmentInstitutionsResult> {
  const segment = await deps.segmentRepository.getById(input.segmentId.trim());
  if (!segment) {
    return Object.freeze({ matchCount: 0, items: Object.freeze([]) });
  }
  const matched = await listMatchedInstitutions(segment, deps);
  const limit = input.limit && input.limit > 0 ? input.limit : 25;
  const items = matched.slice(0, limit).map(toPreview);
  return Object.freeze({
    matchCount: matched.length,
    items: Object.freeze(items),
  });
}
