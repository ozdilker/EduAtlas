import { describe, expect, it } from "vitest";
import {
  createGoogleBusinessSnapshot,
  createInstitution,
  decideGoogleBusinessSync,
  GOOGLE_BUSINESS_CACHE_DAYS,
  GoogleBusinessMatchMethod,
  GoogleBusinessSyncStatus,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
  planGoogleBusinessRetry,
} from "@eduatlas/domain";
import {
  isGoogleSyncEligibleRequest,
  pickBestGooglePlaceMatch,
  scoreGooglePlaceMatch,
} from "./index";

function baseInstitution(
  googleBusiness?: ReturnType<typeof createGoogleBusinessSnapshot>,
) {
  return createInstitution({
    id: "inst-1",
    name: "Örnek Anaokulu",
    slug: "ornek-anaokulu",
    primaryType: InstitutionType.Kindergarten,
    status: InstitutionStatus.Published,
    verification: InstitutionVerification.Unclaimed,
    location: {
      cityId: "tr-34",
      districtId: "tr-34-kadikoy",
      address: "Caferağa Mah. Örnek Sok. No:1",
    },
    shortDescription: "Test kurum",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    publishedAt: "2026-01-01T00:00:00.000Z",
    ...(googleBusiness ? { googleBusiness } : {}),
  });
}

describe("decideGoogleBusinessSync", () => {
  it("syncs when never synced", () => {
    const decision = decideGoogleBusinessSync(baseInstitution());
    expect(decision).toEqual({
      action: "sync",
      reason: "never_synced",
      rematch: false,
    });
  });

  it("skips when cache is fresh", () => {
    const now = new Date("2026-08-01T00:00:00.000Z");
    const lastSyncedAt = new Date(
      now.getTime() - (GOOGLE_BUSINESS_CACHE_DAYS - 1) * 24 * 60 * 60 * 1000,
    ).toISOString();
    const decision = decideGoogleBusinessSync(
      baseInstitution(
        createGoogleBusinessSnapshot({
          placeId: "ChIJabc",
          placeName: "Örnek Anaokulu",
          matchMethod: GoogleBusinessMatchMethod.TextSearch,
          syncStatus: GoogleBusinessSyncStatus.Synced,
          lastSyncedAt,
          retryCount: 0,
          confidenceScore: 0.8,
        }),
      ),
      { now },
    );
    expect(decision.action).toBe("skip");
    if (decision.action === "skip") {
      expect(decision.reason).toBe("cache_fresh");
    }
  });

  it("forces rematch for admin", () => {
    const decision = decideGoogleBusinessSync(
      baseInstitution(
        createGoogleBusinessSnapshot({
          placeId: "ChIJabc",
          matchMethod: GoogleBusinessMatchMethod.TextSearch,
          syncStatus: GoogleBusinessSyncStatus.Synced,
          lastSyncedAt: new Date().toISOString(),
          retryCount: 0,
        }),
      ),
      { rematch: true },
    );
    expect(decision).toEqual({
      action: "sync",
      reason: "admin_rematch",
      rematch: true,
    });
  });
});

describe("planGoogleBusinessRetry", () => {
  it("schedules +7d then +30d then manual", () => {
    const now = new Date("2026-08-01T00:00:00.000Z");
    const first = planGoogleBusinessRetry(undefined, now);
    expect(first.retryCount).toBe(1);
    expect(first.syncStatus).toBe(GoogleBusinessSyncStatus.Failed);
    expect(first.nextRetryAt).toBe("2026-08-08T00:00:00.000Z");

    const second = planGoogleBusinessRetry(
      createGoogleBusinessSnapshot({ retryCount: 1, syncStatus: GoogleBusinessSyncStatus.Failed }),
      now,
    );
    expect(second.retryCount).toBe(2);
    expect(second.nextRetryAt).toBe("2026-08-31T00:00:00.000Z");

    const third = planGoogleBusinessRetry(
      createGoogleBusinessSnapshot({ retryCount: 2, syncStatus: GoogleBusinessSyncStatus.Failed }),
      now,
    );
    expect(third.retryCount).toBe(3);
    expect(third.syncStatus).toBe(GoogleBusinessSyncStatus.ManualRequired);
    expect(third.nextRetryAt).toBeUndefined();
  });
});

describe("scoreGooglePlaceMatch", () => {
  it("scores exact name highly", () => {
    const score = scoreGooglePlaceMatch({
      institutionName: "Örnek Anaokulu",
      institutionAddress: "Caferağa Mah. Örnek Sok. No:1",
      candidate: {
        placeId: "1",
        placeName: "Ornek Anaokulu",
        formattedAddress: "Caferaga Mah. Ornek Sok. No:1, Kadikoy",
      },
    });
    expect(score).toBeGreaterThanOrEqual(0.7);
  });

  it("picks best candidate above threshold", () => {
    const picked = pickBestGooglePlaceMatch("Örnek Anaokulu", "Caferağa Mah.", [
      { placeId: "bad", placeName: "Tamamen Farklı Kurs" },
      {
        placeId: "good",
        placeName: "Örnek Anaokulu",
        formattedAddress: "Caferağa Mah. Kadıköy",
      },
    ]);
    expect(picked?.candidate.placeId).toBe("good");
  });
});

describe("isGoogleSyncEligibleRequest", () => {
  it("rejects bots and prefetch", () => {
    expect(
      isGoogleSyncEligibleRequest({
        "user-agent": "Googlebot/2.1",
      }),
    ).toBe(false);

    expect(
      isGoogleSyncEligibleRequest({
        "user-agent": "Mozilla/5.0",
        purpose: "prefetch",
      }),
    ).toBe(false);

    expect(
      isGoogleSyncEligibleRequest({
        "user-agent": "Mozilla/5.0",
        "next-router-prefetch": "1",
      }),
    ).toBe(false);
  });

  it("allows real browsers", () => {
    expect(
      isGoogleSyncEligibleRequest({
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
      }),
    ).toBe(true);
  });
});
