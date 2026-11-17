import {
  seoActionFingerprintForQuery,
  seoActionFingerprintForUrl,
  seoActionSourceKeyForQuery,
  seoActionSourceKeyForUrl,
} from "./seo-action-fingerprint";
import {
  SEO_OPPORTUNITY_THRESHOLDS,
  type SeoSnapshotPageRow,
  type SeoSnapshotQueryRow,
} from "./seo-snapshot";

export type SeoActionPriority = "high" | "medium" | "low";

export type SeoActionKind =
  | "ctr_page"
  | "ranking_page"
  | "ctr_and_ranking_page"
  | "query_opportunity"
  | "unmatched_url";

export type SeoActionItem = Readonly<{
  readonly id: string;
  /** Stable task doc id — independent of kind/priority. */
  readonly fingerprint: string;
  readonly sourceKey: string;
  readonly kind: SeoActionKind;
  readonly priority: SeoActionPriority;
  readonly title: string;
  readonly recommendation: string;
  readonly targetLabel: string;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctr: number;
  readonly position: number;
  readonly institutionName: string | null;
  readonly profileHref: string | null;
}>;

export type SeoActionPlan = Readonly<{
  readonly prioritizedActions: readonly SeoActionItem[];
  readonly ctrPageOpportunities: readonly SeoActionItem[];
  readonly rankingPageOpportunities: readonly SeoActionItem[];
  readonly queryOpportunities: readonly SeoActionItem[];
  readonly unmatchedUrlOpportunities: readonly SeoActionItem[];
}>;

export type SeoActionPageInput = SeoSnapshotPageRow &
  Readonly<{
    readonly institutionName: string | null;
    readonly profileHref: string | null;
    readonly matchStatus: "matched" | "unmatched" | "ambiguous" | "not_institution";
  }>;

export type SeoActionQueryInput = SeoSnapshotQueryRow &
  Readonly<{
    readonly matchedInstitutionName: string | null;
  }>;

const ACTION_LIMIT = SEO_OPPORTUNITY_THRESHOLDS.opportunityLimit;
const PRIORITIZED_LIMIT = 20;
const HIGH_IMPRESSION_QUERY_MIN = 100;
const HIGH_PRIORITY_IMPRESSIONS = 500;
const MEDIUM_PRIORITY_IMPRESSIONS = 200;

function priorityByImpressions(impressions: number): SeoActionPriority {
  if (impressions >= HIGH_PRIORITY_IMPRESSIONS) return "high";
  if (impressions >= MEDIUM_PRIORITY_IMPRESSIONS) return "medium";
  return "low";
}

function priorityRank(priority: SeoActionPriority): number {
  switch (priority) {
    case "high":
      return 0;
    case "medium":
      return 1;
    default:
      return 2;
  }
}

function sortActions(items: readonly SeoActionItem[]): SeoActionItem[] {
  return items
    .slice()
    .sort(
      (a, b) =>
        priorityRank(a.priority) - priorityRank(b.priority) ||
        b.impressions - a.impressions ||
        b.clicks - a.clicks,
    );
}

/** Keeps first occurrence after sort — CTR/ranking preferred over unmatched for same URL. */
function dedupePrioritizedByFingerprint(
  items: readonly SeoActionItem[],
): SeoActionItem[] {
  const seen = new Set<string>();
  const unique: SeoActionItem[] = [];
  for (const item of items) {
    if (seen.has(item.fingerprint)) continue;
    seen.add(item.fingerprint);
    unique.push(item);
  }
  return unique;
}

/** True for site root URLs such as https://eduatlas.com.tr/ */
export function isSeoHomepageUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  try {
    if (trimmed.startsWith("/")) {
      const path = (trimmed.split("?")[0] ?? "/").replace(/\/+$/, "") || "/";
      return path === "/";
    }
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return path === "/";
  } catch {
    return false;
  }
}

function isInstitutionProfile(row: SeoActionPageInput): boolean {
  return row.matchStatus === "matched" && Boolean(row.institutionName);
}

function isLowCtr(row: SeoActionPageInput): boolean {
  return (
    row.impressions >= SEO_OPPORTUNITY_THRESHOLDS.lowCtrMinImpressions &&
    row.ctr < SEO_OPPORTUNITY_THRESHOLDS.lowCtrMaxCtr
  );
}

function isMidPosition(row: SeoActionPageInput): boolean {
  return (
    row.impressions >= SEO_OPPORTUNITY_THRESHOLDS.midPositionMinImpressions &&
    row.position >= SEO_OPPORTUNITY_THRESHOLDS.midPositionMin &&
    row.position <= SEO_OPPORTUNITY_THRESHOLDS.midPositionMax
  );
}

function pageTargetLabel(row: SeoActionPageInput): string {
  if (isSeoHomepageUrl(row.url)) return "Ana sayfa";
  return row.institutionName ?? row.url;
}

function ctrSnippetAdvice(row: SeoActionPageInput): string {
  if (isSeoHomepageUrl(row.url)) {
    return "Ana sayfa title/meta description’ını şehir, kurum türü ve EduAtlas değer önerisine göre netleştirin; ilk 60/155 karakterde arama niyetini taşıyın.";
  }
  if (isInstitutionProfile(row)) {
    return `“${row.institutionName}” için title ve meta description’ı arama niyetine göre netleştirin; kurum türü, il/ilçe ve farklılaştırıcı ifadeyi ilk 60/155 karaktere taşıyın.`;
  }
  return "Bu sayfa için title ve meta description’ı arama niyetine göre netleştirin; ilk 60/155 karakterde farklılaştırıcı ifadeyi öne çıkarın.";
}

function rankingContentAdvice(row: SeoActionPageInput): string {
  if (isSeoHomepageUrl(row.url)) {
    return "Ana sayfada kategori/şehir hub’larına ve güçlü navigasyon yollarına dahili linkleri güçlendirin; öne çıkan kurum ve arama CTA’larını netleştirin.";
  }
  if (isInstitutionProfile(row)) {
    return `“${row.institutionName}” profil içeriğini (programlar, SSS, güncel bilgiler) güçlendirin ve ilgili şehir/kategori sayfalarından dahili link desteği ekleyin.`;
  }
  return "Sayfa içeriğini ve ilgili hub sayfalarına dahili bağlantıları güçlendirin.";
}

function ctrOnlyRecommendation(row: SeoActionPageInput): string {
  return ctrSnippetAdvice(row);
}

function rankingOnlyRecommendation(row: SeoActionPageInput): string {
  return rankingContentAdvice(row);
}

function combinedRecommendation(row: SeoActionPageInput): string {
  return `${ctrSnippetAdvice(row)} Ardından ${rankingContentAdvice(row)}`;
}

function queryRecommendation(row: SeoActionQueryInput): string {
  if (row.matchedInstitutionName) {
    return `“${row.query}” sorgusu “${row.matchedInstitutionName}” ile eşleşiyor; profil başlığı/özetini bu sorguya yaklaştırın.`;
  }
  if (row.ctr < SEO_OPPORTUNITY_THRESHOLDS.lowCtrMaxCtr) {
    return `“${row.query}” yüksek gösterim / düşük CTR; hedef sorgu için yeni landing veya mevcut kategori/şehir sayfasını bu terime göre iyileştirin.`;
  }
  return `“${row.query}” için içerik veya landing page fırsatı; şehir + kurum türü kombinasyonuyla hedef sayfa oluşturmayı veya mevcut hub’ı güçlendirmeyi değerlendirin.`;
}

function unmatchedRecommendation(_row: SeoActionPageInput): string {
  return `Kurum kataloğunda eşleşmeyen URL: slug/yayın durumunu kontrol edin veya yönlendirme ekleyin. Gösterim kaybını önlemek için 404/orphan riskini giderin.`;
}

function toPageAction(
  row: SeoActionPageInput,
  kind: "ctr_page" | "ranking_page" | "ctr_and_ranking_page",
): SeoActionItem {
  const title =
    kind === "ctr_and_ranking_page"
      ? "CTR + sıralama fırsatı"
      : kind === "ctr_page"
        ? "CTR fırsatı"
        : "Sıralama fırsatı (konum 4–20)";
  const recommendation =
    kind === "ctr_and_ranking_page"
      ? combinedRecommendation(row)
      : kind === "ctr_page"
        ? ctrOnlyRecommendation(row)
        : rankingOnlyRecommendation(row);

  const sourceKey = seoActionSourceKeyForUrl(row.url);
  return Object.freeze({
    id: `${kind}:${row.url}`,
    fingerprint: seoActionFingerprintForUrl(row.url),
    sourceKey,
    kind,
    priority: priorityByImpressions(row.impressions),
    title,
    recommendation,
    targetLabel: pageTargetLabel(row),
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
    institutionName: isInstitutionProfile(row) ? row.institutionName : null,
    profileHref: isInstitutionProfile(row) ? row.profileHref : null,
  });
}

/**
 * Builds prioritized, actionable SEO recommendations from GSC snapshot rows.
 * Pure derivation — does not invent metrics or call Google APIs.
 * Same URL never appears as both CTR and ranking actions.
 */
export function buildSeoActionPlan(input: Readonly<{
  readonly pages: readonly SeoActionPageInput[];
  readonly queries: readonly SeoActionQueryInput[];
}>): SeoActionPlan {
  const ctrOnly: SeoActionItem[] = [];
  const rankingOnly: SeoActionItem[] = [];
  const combined: SeoActionItem[] = [];

  const pageCandidates = input.pages
    .slice()
    .sort((a, b) => b.impressions - a.impressions);

  for (const row of pageCandidates) {
    const lowCtr = isLowCtr(row);
    const midPos = isMidPosition(row);
    if (lowCtr && midPos) {
      if (combined.length < ACTION_LIMIT) {
        combined.push(toPageAction(row, "ctr_and_ranking_page"));
      }
      continue;
    }
    if (lowCtr) {
      if (ctrOnly.length < ACTION_LIMIT) {
        ctrOnly.push(toPageAction(row, "ctr_page"));
      }
      continue;
    }
    if (midPos) {
      if (rankingOnly.length < ACTION_LIMIT) {
        rankingOnly.push(toPageAction(row, "ranking_page"));
      }
    }
  }

  // Category lists: combined shown under CTR section; ranking section stays ranking-only.
  const ctrPageOpportunities = Object.freeze(
    [...combined, ...ctrOnly].slice(0, ACTION_LIMIT),
  );
  const rankingPageOpportunities = Object.freeze(rankingOnly.slice(0, ACTION_LIMIT));

  const queryOpportunities = input.queries
    .filter((row) => row.impressions >= HIGH_IMPRESSION_QUERY_MIN)
    .slice()
    .sort((a, b) => b.impressions - a.impressions || a.ctr - b.ctr)
    .slice(0, ACTION_LIMIT)
    .map((row) => {
      const sourceKey = seoActionSourceKeyForQuery(row.query);
      return Object.freeze({
        id: `query:${row.query}`,
        fingerprint: seoActionFingerprintForQuery(row.query),
        sourceKey,
        kind: "query_opportunity" as const,
        priority:
          row.impressions >= HIGH_PRIORITY_IMPRESSIONS &&
          row.ctr < SEO_OPPORTUNITY_THRESHOLDS.lowCtrMaxCtr
            ? ("high" as const)
            : priorityByImpressions(row.impressions),
        title: "Arama sorgusu fırsatı",
        recommendation: queryRecommendation(row),
        targetLabel: row.query,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        institutionName: row.matchedInstitutionName,
        profileHref: null,
      });
    });

  const unmatchedUrlOpportunities = input.pages
    .filter(
      (row) =>
        (row.matchStatus === "unmatched" || row.matchStatus === "ambiguous") &&
        row.impressions > 0,
    )
    .slice()
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, ACTION_LIMIT)
    .map((row) => {
      const sourceKey = seoActionSourceKeyForUrl(row.url);
      return Object.freeze({
        id: `unmatched:${row.url}`,
        fingerprint: seoActionFingerprintForUrl(row.url),
        sourceKey,
        kind: "unmatched_url" as const,
        priority: priorityByImpressions(row.impressions),
        title: "Eşleşmeyen kurum URL’si",
        recommendation: unmatchedRecommendation(row),
        targetLabel: row.url,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        institutionName: null,
        profileHref: null,
      });
    });

  const prioritizedActions = Object.freeze(
    dedupePrioritizedByFingerprint(
      sortActions([
        ...combined,
        ...ctrOnly,
        ...rankingOnly,
        ...queryOpportunities,
        ...unmatchedUrlOpportunities,
      ]),
    ).slice(0, PRIORITIZED_LIMIT),
  );

  return Object.freeze({
    prioritizedActions,
    ctrPageOpportunities,
    rankingPageOpportunities,
    queryOpportunities: Object.freeze(queryOpportunities),
    unmatchedUrlOpportunities: Object.freeze(unmatchedUrlOpportunities),
  });
}

export const EMPTY_SEO_ACTION_PLAN: SeoActionPlan = Object.freeze({
  prioritizedActions: Object.freeze([]),
  ctrPageOpportunities: Object.freeze([]),
  rankingPageOpportunities: Object.freeze([]),
  queryOpportunities: Object.freeze([]),
  unmatchedUrlOpportunities: Object.freeze([]),
});
