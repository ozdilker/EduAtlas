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
  buildGooglePlaceSearchQuery,
  GOOGLE_PLACE_MATCH_MIN_CONFIDENCE,
  GOOGLE_PLACE_MATCH_MIN_MARGIN,
  GOOGLE_PLACE_PHONE_MATCH_BOOST,
  GOOGLE_PLACE_PHONE_MISMATCH_PENALTY,
  hasClearGeoConflict,
  isGoogleSyncEligibleRequest,
  pickBestGooglePlaceMatch,
  resolvePhoneScoreDelta,
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

describe("buildGooglePlaceSearchQuery", () => {
  it("builds ENKA query from name + district + city without full street address", () => {
    const institution = createInstitution({
      id: "inst_ozel_enka_anadolu_lisesi",
      name: "ÖZEL ENKA ANADOLU LİSESİ",
      slug: "ozel-enka-anadolu-lisesi",
      primaryType: InstitutionType.PrivateSchool,
      status: InstitutionStatus.Published,
      verification: InstitutionVerification.Unclaimed,
      location: {
        cityId: "istanbul",
        districtId: "istanbul-sariyer",
        address: "POLİGON MAH. SARIYER CAD. NO: 121 İÇ KAPI NO: 3 SARIYER / İSTANBUL",
      },
      shortDescription: "Test",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      publishedAt: "2026-01-01T00:00:00.000Z",
    });

    const query = buildGooglePlaceSearchQuery(institution, {
      cityName: "İstanbul",
      districtName: "Sarıyer",
    });

    expect(query).toBe("ÖZEL ENKA ANADOLU LİSESİ Sarıyer İstanbul");
    expect(query).not.toContain("POLİGON");
    expect(query).not.toContain("İÇ KAPI");
    expect(query).not.toContain("NO:");
  });
});

describe("scoreGooglePlaceMatch", () => {
  it("scores exact name highly with Turkish folding", () => {
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

  it("matches ENKA brand name variants when district address agrees", () => {
    const score = scoreGooglePlaceMatch({
      institutionName: "ÖZEL ENKA ANADOLU LİSESİ",
      institutionAddress: "POLİGON MAH. SARIYER CAD. NO: 121 SARIYER / İSTANBUL",
      cityName: "İstanbul",
      districtName: "Sarıyer",
      candidate: {
        placeId: "enka-sariyer",
        placeName: "ENKA Okulları",
        formattedAddress: "Poligon Mah. Sarıyer Cad. No:121, Sarıyer/İstanbul",
      },
    });
    expect(score).toBeGreaterThanOrEqual(GOOGLE_PLACE_MATCH_MIN_CONFIDENCE);
  });

  it("does not confuse preschool and high-school grades for the same brand", () => {
    const score = scoreGooglePlaceMatch({
      institutionName: "ÖZEL ENKA ANADOLU LİSESİ",
      institutionAddress: "POLİGON MAH. SARIYER CAD. NO: 121 SARIYER / İSTANBUL",
      cityName: "İstanbul",
      districtName: "Sarıyer",
      candidate: {
        placeId: "enka-anaokulu",
        placeName: "Özel ENKA Anaokulu",
        formattedAddress: "Poligon Mah. Sarıyer Cad. No:121, Sarıyer/İstanbul",
      },
    });
    expect(score).toBe(0);
  });

  it("does not confuse primary and middle school grades", () => {
    const score = scoreGooglePlaceMatch({
      institutionName: "Örnek İlkokulu",
      institutionAddress: "Caferağa Mah. Kadıköy / İstanbul",
      cityName: "İstanbul",
      districtName: "Kadıköy",
      candidate: {
        placeId: "ortaokul",
        placeName: "Örnek Ortaokulu",
        formattedAddress: "Caferağa Mah. Kadıköy/İstanbul",
      },
    });
    expect(score).toBe(0);
  });
});

describe("hasClearGeoConflict", () => {
  const istanbulSariyer = {
    cityName: "İstanbul",
    districtName: "Sarıyer",
  } as const;

  it("rejects same city with a clearly different district", () => {
    expect(
      hasClearGeoConflict({
        ...istanbulSariyer,
        candidateAddress: "Levent Mah. Beşiktaş/İstanbul",
      }),
    ).toBe(true);
  });

  it("does not reject when only the city is present", () => {
    expect(
      hasClearGeoConflict({
        ...istanbulSariyer,
        candidateAddress: "İstanbul",
      }),
    ).toBe(false);
  });

  it("does not reject when only the district is present", () => {
    expect(
      hasClearGeoConflict({
        ...istanbulSariyer,
        candidateAddress: "Sarıyer",
      }),
    ).toBe(false);
  });

  it("does not reject a street-only address that lacks city and district", () => {
    expect(
      hasClearGeoConflict({
        ...istanbulSariyer,
        candidateAddress: "Poligon Mah. No: 121",
      }),
    ).toBe(false);
  });

  it("rejects a clearly different city", () => {
    expect(
      hasClearGeoConflict({
        ...istanbulSariyer,
        candidateAddress: "Çankaya/Ankara",
      }),
    ).toBe(true);
  });

  it("accepts matching city and district including ASCII folding variants", () => {
    expect(
      hasClearGeoConflict({
        ...istanbulSariyer,
        candidateAddress: "Poligon Mah. Sariyer/Istanbul",
      }),
    ).toBe(false);
    expect(
      hasClearGeoConflict({
        ...istanbulSariyer,
        candidateAddress: "Sarıyer / İstanbul",
      }),
    ).toBe(false);
  });

  it("does not reject a completely empty candidate address", () => {
    expect(
      hasClearGeoConflict({
        ...istanbulSariyer,
        candidateAddress: "",
      }),
    ).toBe(false);
    expect(
      hasClearGeoConflict({
        ...istanbulSariyer,
        candidateAddress: undefined,
      }),
    ).toBe(false);
  });
});

describe("pickBestGooglePlaceMatch", () => {
  it("accepts a single strong candidate", () => {
    const picked = pickBestGooglePlaceMatch(
      "Örnek Anaokulu",
      "Caferağa Mah. Kadıköy",
      [
        {
          placeId: "good",
          placeName: "Örnek Anaokulu",
          formattedAddress: "Caferağa Mah. Kadıköy/İstanbul",
        },
      ],
      { cityName: "İstanbul", districtName: "Kadıköy" },
    );
    expect(picked?.candidate.placeId).toBe("good");
    expect(picked?.confidenceScore).toBeGreaterThanOrEqual(GOOGLE_PLACE_MATCH_MIN_CONFIDENCE);
  });

  it("rejects when two strong candidates are within the margin", () => {
    const picked = pickBestGooglePlaceMatch(
      "Örnek Anaokulu",
      "Caferağa Mah. Kadıköy",
      [
        {
          placeId: "a",
          placeName: "Örnek Anaokulu",
          formattedAddress: "Caferağa Mah. Kadıköy/İstanbul",
        },
        {
          placeId: "b",
          placeName: "Ornek Anaokulu",
          formattedAddress: "Caferaga Mah. Kadikoy/Istanbul",
        },
      ],
      { cityName: "İstanbul", districtName: "Kadıköy" },
    );
    expect(picked).toBeNull();
    expect(GOOGLE_PLACE_MATCH_MIN_MARGIN).toBe(0.12);
  });

  it("accepts when best candidate beats the second by enough margin", () => {
    const picked = pickBestGooglePlaceMatch(
      "Örnek Anaokulu",
      "Caferağa Mah. Kadıköy",
      [
        {
          placeId: "good",
          placeName: "Örnek Anaokulu",
          formattedAddress: "Caferağa Mah. Kadıköy/İstanbul",
        },
        {
          placeId: "weak",
          placeName: "Başka Kurs",
          formattedAddress: "Moda Cad. Kadıköy/İstanbul",
        },
      ],
      { cityName: "İstanbul", districtName: "Kadıköy" },
    );
    expect(picked?.candidate.placeId).toBe("good");
  });

  it("rejects the same-named institution in a different district", () => {
    const picked = pickBestGooglePlaceMatch(
      "Örnek Anaokulu",
      "Caferağa Mah. Kadıköy / İstanbul",
      [
        {
          placeId: "besiktas",
          placeName: "Örnek Anaokulu",
          formattedAddress: "Levent Mah. Beşiktaş/İstanbul",
        },
      ],
      { cityName: "İstanbul", districtName: "Kadıköy" },
    );
    expect(picked).toBeNull();
  });

  it("rejects the same brand in a different city", () => {
    const picked = pickBestGooglePlaceMatch(
      "ÖZEL ENKA ANADOLU LİSESİ",
      "POLİGON MAH. SARIYER CAD. NO: 121 SARIYER / İSTANBUL",
      [
        {
          placeId: "enka-adapazari",
          placeName: "ENKA Okulları Adapazarı",
          formattedAddress: "Dağdibi Mah. Enka Yolu Cad. No:66, Adapazarı/Sakarya",
        },
      ],
      { cityName: "İstanbul", districtName: "Sarıyer" },
    );
    expect(picked).toBeNull();
  });

  it("does not reject solely because candidate address is missing", () => {
    const score = scoreGooglePlaceMatch({
      institutionName: "Örnek Anaokulu",
      institutionAddress: "Caferağa Mah. Kadıköy",
      cityName: "İstanbul",
      districtName: "Kadıköy",
      candidate: {
        placeId: "no-address",
        placeName: "Örnek Anaokulu",
      },
    });
    expect(score).toBeGreaterThanOrEqual(GOOGLE_PLACE_MATCH_MIN_CONFIDENCE);

    const picked = pickBestGooglePlaceMatch(
      "Örnek Anaokulu",
      "Caferağa Mah. Kadıköy",
      [{ placeId: "no-address", placeName: "Örnek Anaokulu" }],
      { cityName: "İstanbul", districtName: "Kadıköy" },
    );
    expect(picked?.candidate.placeId).toBe("no-address");
  });
});

describe("phone match signal", () => {
  const baseCandidate = {
    placeId: "phone-1",
    placeName: "Örnek Anaokulu",
    formattedAddress: "Caferağa Mah. Kadıköy/İstanbul",
    nationalPhoneNumber: "0212 705 65 00",
  } as const;

  it("keeps score unchanged when institution has no phone", () => {
    const withoutPhone = scoreGooglePlaceMatch({
      institutionName: "Örnek Anaokulu",
      institutionAddress: "Caferağa Mah. Kadıköy",
      cityName: "İstanbul",
      districtName: "Kadıköy",
      candidate: baseCandidate,
    });
    const withEmptyPhone = scoreGooglePlaceMatch({
      institutionName: "Örnek Anaokulu",
      institutionAddress: "Caferağa Mah. Kadıköy",
      cityName: "İstanbul",
      districtName: "Kadıköy",
      contactPhone: "   ",
      candidate: baseCandidate,
    });
    expect(withEmptyPhone).toBe(withoutPhone);
    expect(resolvePhoneScoreDelta({ candidate: baseCandidate })).toBe(0);
  });

  it("matches +90, leading-0, and parenthesized TR phone formats", () => {
    expect(
      resolvePhoneScoreDelta({
        contactPhone: "+90 212 705 65 00",
        candidate: baseCandidate,
      }),
    ).toBe(GOOGLE_PLACE_PHONE_MATCH_BOOST);
    expect(
      resolvePhoneScoreDelta({
        contactPhone: "0212 705 65 00",
        candidate: { ...baseCandidate, nationalPhoneNumber: "(212) 705 65 00" },
      }),
    ).toBe(GOOGLE_PLACE_PHONE_MATCH_BOOST);
  });

  it("applies a small positive boost when primary phones match", () => {
    expect(
      resolvePhoneScoreDelta({
        contactPhone: "+90 212 705 65 00",
        candidate: baseCandidate,
      }),
    ).toBe(GOOGLE_PLACE_PHONE_MATCH_BOOST);

    // Mid-strength name so the score is not already capped at 1.0.
    const withoutPhone = scoreGooglePlaceMatch({
      institutionName: "ENKA Anadolu",
      institutionAddress: "Poligon Mah. Sarıyer",
      cityName: "İstanbul",
      districtName: "Sarıyer",
      candidate: {
        placeId: "enka",
        placeName: "ENKA Okulları",
        formattedAddress: "Poligon Mah. Sarıyer/İstanbul",
      },
    });
    const withPhone = scoreGooglePlaceMatch({
      institutionName: "ENKA Anadolu",
      institutionAddress: "Poligon Mah. Sarıyer",
      cityName: "İstanbul",
      districtName: "Sarıyer",
      contactPhone: "+90 212 705 65 00",
      candidate: {
        placeId: "enka",
        placeName: "ENKA Okulları",
        formattedAddress: "Poligon Mah. Sarıyer/İstanbul",
        nationalPhoneNumber: "0212 705 65 00",
      },
    });
    expect(withoutPhone).toBeLessThan(1);
    expect(withPhone).toBeGreaterThan(withoutPhone);
    expect(withPhone - withoutPhone).toBeCloseTo(GOOGLE_PLACE_PHONE_MATCH_BOOST, 3);
  });

  it("applies a controlled negative penalty on phone mismatch without hard-reject alone", () => {
    const delta = resolvePhoneScoreDelta({
      contactPhone: "0216 111 22 33",
      candidate: baseCandidate,
    });
    expect(delta).toBe(GOOGLE_PLACE_PHONE_MISMATCH_PENALTY);

    const picked = pickBestGooglePlaceMatch(
      "Örnek Anaokulu",
      "Caferağa Mah. Kadıköy",
      [baseCandidate],
      {
        cityName: "İstanbul",
        districtName: "Kadıköy",
        contactPhone: "0216 111 22 33",
      },
    );
    // Strong name+address still clears the floor despite mismatch penalty.
    expect(picked?.candidate.placeId).toBe("phone-1");
  });

  it("does not let phone match alone push a weak name over the confidence floor", () => {
    const score = scoreGooglePlaceMatch({
      institutionName: "Tamamen Farklı Kurum Adı XYZ",
      institutionAddress: "Caferağa Mah. Kadıköy",
      cityName: "İstanbul",
      districtName: "Kadıköy",
      contactPhone: "+90 212 705 65 00",
      candidate: {
        placeId: "weak",
        placeName: "Başka Bir Yer",
        formattedAddress: "Caferağa Mah. Kadıköy/İstanbul",
        nationalPhoneNumber: "0212 705 65 00",
      },
    });
    expect(score).toBeLessThan(GOOGLE_PLACE_MATCH_MIN_CONFIDENCE);
  });

  it("keeps margin rejection when two candidates share the same switchboard phone", () => {
    const sharedPhone = "0212 705 65 00";
    const picked = pickBestGooglePlaceMatch(
      "Örnek Anaokulu",
      "Caferağa Mah. Kadıköy",
      [
        {
          placeId: "a",
          placeName: "Örnek Anaokulu",
          formattedAddress: "Caferağa Mah. Kadıköy/İstanbul",
          nationalPhoneNumber: sharedPhone,
        },
        {
          placeId: "b",
          placeName: "Ornek Anaokulu",
          formattedAddress: "Caferaga Mah. Kadikoy/Istanbul",
          nationalPhoneNumber: sharedPhone,
        },
      ],
      {
        cityName: "İstanbul",
        districtName: "Kadıköy",
        contactPhone: sharedPhone,
      },
    );
    expect(picked).toBeNull();
  });

  it("does not let phone match override preschool vs high-school grade conflict", () => {
    const score = scoreGooglePlaceMatch({
      institutionName: "ÖZEL ENKA ANADOLU LİSESİ",
      institutionAddress: "POLİGON MAH. SARIYER CAD. NO: 121 SARIYER / İSTANBUL",
      cityName: "İstanbul",
      districtName: "Sarıyer",
      contactPhone: "+90 212 705 65 00",
      candidate: {
        placeId: "enka-anaokulu",
        placeName: "Özel ENKA Anaokulu",
        formattedAddress: "Poligon Mah. Sarıyer Cad. No:121, Sarıyer/İstanbul",
        nationalPhoneNumber: "0212 705 65 00",
      },
    });
    expect(score).toBe(0);
  });

  it("does not penalize when the Google candidate has no phone", () => {
    expect(
      resolvePhoneScoreDelta({
        contactPhone: "0212 705 65 00",
        candidate: {
          placeId: "no-phone",
          placeName: "Örnek Anaokulu",
          formattedAddress: "Caferağa Mah. Kadıköy/İstanbul",
        },
      }),
    ).toBe(0);
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
