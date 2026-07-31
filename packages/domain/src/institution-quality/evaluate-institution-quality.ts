import type { Institution } from "../institution/institution";
import { institutionIdAsString } from "../institution/institution-id";
import { InstitutionVerification } from "../institution/institution-verification";
import {
  createInstitutionQualityScore,
  type InstitutionQualityScore,
  type QualityDimensionScore,
} from "./institution-quality-score";
import { QUALITY_DIMENSION_WEIGHTS, QualityDimension } from "./quality-dimension";
import { qualityGradeFromScore } from "./quality-grade";
import { createQualityIssue, type QualityIssue, QualityIssueSeverity } from "./quality-issue";
import { qualityLevelFromScore } from "./quality-level";

export type EvaluateInstitutionQualityInput = {
  institution: Institution;
  now?: string;
};

type DimensionEval = {
  earned: number;
  complete: boolean;
  missingFields: string[];
  issues: QualityIssue[];
};

/**
 * Pure domain: evaluate internal Institution Quality Score across fixed dimensions.
 * This is NOT the public Growth Score.
 */
export function evaluateInstitutionQuality(
  input: EvaluateInstitutionQualityInput,
): InstitutionQualityScore {
  const { institution } = input;
  const calculatedAt = input.now ?? new Date().toISOString();

  const identity = evalIdentity(institution);
  const contact = evalContact(institution);
  const location = evalLocation(institution);
  const description = evalDescription(institution);
  const gallery = evalGallery(institution);
  const programs = evalPrograms(institution);
  const verification = evalVerification(institution);
  const categories = evalCategories(institution);
  const website = evalWebsite(institution);
  const social = evalSocialLinks(institution);

  const byDimension: ReadonlyArray<{ dimension: QualityDimension; eval: DimensionEval }> = [
    { dimension: QualityDimension.Identity, eval: identity },
    { dimension: QualityDimension.Contact, eval: contact },
    { dimension: QualityDimension.Location, eval: location },
    { dimension: QualityDimension.Description, eval: description },
    { dimension: QualityDimension.Gallery, eval: gallery },
    { dimension: QualityDimension.Programs, eval: programs },
    { dimension: QualityDimension.Verification, eval: verification },
    { dimension: QualityDimension.Categories, eval: categories },
    { dimension: QualityDimension.Website, eval: website },
    { dimension: QualityDimension.SocialLinks, eval: social },
  ];

  const dimensions: QualityDimensionScore[] = byDimension.map(({ dimension, eval: result }) =>
    Object.freeze({
      dimension,
      earned: result.earned,
      max: QUALITY_DIMENSION_WEIGHTS[dimension],
      complete: result.complete,
    }),
  );

  const score = Math.min(
    100,
    Math.max(0, Math.round(byDimension.reduce((sum, item) => sum + item.eval.earned, 0))),
  );

  const missingFields = Object.freeze([
    ...new Set(byDimension.flatMap((item) => item.eval.missingFields)),
  ]);
  const qualityIssues = Object.freeze(byDimension.flatMap((item) => item.eval.issues));

  return createInstitutionQualityScore({
    institutionId: institutionIdAsString(institution.id),
    score,
    grade: qualityGradeFromScore(score),
    qualityLevel: qualityLevelFromScore(score),
    missingFields,
    qualityIssues,
    dimensions,
    calculatedAt,
  });
}

function evalIdentity(institution: Institution): DimensionEval {
  const max = QUALITY_DIMENSION_WEIGHTS[QualityDimension.Identity];
  const missingFields: string[] = [];
  const issues: QualityIssue[] = [];
  let earned = 0;

  if (institution.name.trim()) earned += 4;
  else {
    missingFields.push("name");
    issues.push(
      createQualityIssue({
        code: "missing_name",
        dimension: QualityDimension.Identity,
        severity: QualityIssueSeverity.Critical,
        message: "Kurum adı eksik.",
        field: "name",
      }),
    );
  }

  if (institution.slug.trim()) earned += 3;
  else {
    missingFields.push("slug");
    issues.push(
      createQualityIssue({
        code: "missing_slug",
        dimension: QualityDimension.Identity,
        severity: QualityIssueSeverity.Critical,
        message: "Kurum slug değeri eksik.",
        field: "slug",
      }),
    );
  }

  if (institution.primaryType) earned += 2;

  if (institution.logoUrl?.trim()) earned += 1;
  else {
    missingFields.push("logoUrl");
    issues.push(
      createQualityIssue({
        code: "missing_logo",
        dimension: QualityDimension.Identity,
        severity: QualityIssueSeverity.Minor,
        message: "Logo eksik.",
        field: "logoUrl",
      }),
    );
  }

  return {
    earned: Math.min(max, earned),
    complete: missingFields.length === 0,
    missingFields,
    issues,
  };
}

function evalContact(institution: Institution): DimensionEval {
  const max = QUALITY_DIMENSION_WEIGHTS[QualityDimension.Contact];
  const missingFields: string[] = [];
  const issues: QualityIssue[] = [];
  let earned = 0;
  const hasPhone = Boolean(institution.contact.phone?.trim());
  const hasEmail = Boolean(institution.contact.email?.trim());

  if (hasPhone) earned += 7;
  else {
    missingFields.push("contact.phone");
    issues.push(
      createQualityIssue({
        code: "missing_phone",
        dimension: QualityDimension.Contact,
        severity: QualityIssueSeverity.Major,
        message: "Telefon numarası eksik.",
        field: "contact.phone",
      }),
    );
  }

  if (hasEmail) earned += 5;
  else {
    missingFields.push("contact.email");
    issues.push(
      createQualityIssue({
        code: "missing_email",
        dimension: QualityDimension.Contact,
        severity: QualityIssueSeverity.Minor,
        message: "E-posta adresi eksik.",
        field: "contact.email",
      }),
    );
  }

  if (!hasPhone && !hasEmail) {
    issues.push(
      createQualityIssue({
        code: "missing_contact_channel",
        dimension: QualityDimension.Contact,
        severity: QualityIssueSeverity.Critical,
        message: "Telefon veya e-posta gerekli.",
        field: "contact",
      }),
    );
  }

  return {
    earned: Math.min(max, earned),
    complete: hasPhone && hasEmail,
    missingFields,
    issues,
  };
}

function evalLocation(institution: Institution): DimensionEval {
  const max = QUALITY_DIMENSION_WEIGHTS[QualityDimension.Location];
  const missingFields: string[] = [];
  const issues: QualityIssue[] = [];
  let earned = 0;
  const loc = institution.location;

  if (loc.cityId?.trim()) earned += 3;
  else {
    missingFields.push("location.cityId");
    issues.push(
      createQualityIssue({
        code: "missing_city",
        dimension: QualityDimension.Location,
        severity: QualityIssueSeverity.Critical,
        message: "Şehir bilgisi eksik.",
        field: "location.cityId",
      }),
    );
  }

  if (loc.districtId?.trim()) earned += 3;
  else {
    missingFields.push("location.districtId");
    issues.push(
      createQualityIssue({
        code: "missing_district",
        dimension: QualityDimension.Location,
        severity: QualityIssueSeverity.Critical,
        message: "İlçe bilgisi eksik.",
        field: "location.districtId",
      }),
    );
  }

  if (loc.address?.trim()) earned += 4;
  else {
    missingFields.push("location.address");
    issues.push(
      createQualityIssue({
        code: "missing_address",
        dimension: QualityDimension.Location,
        severity: QualityIssueSeverity.Major,
        message: "Adres eksik.",
        field: "location.address",
      }),
    );
  }

  if (loc.latitude !== undefined && loc.longitude !== undefined) earned += 2;
  else if (loc.googleMapsUrl?.trim()) earned += 2;
  else {
    missingFields.push("location.coordinates");
    issues.push(
      createQualityIssue({
        code: "missing_coordinates",
        dimension: QualityDimension.Location,
        severity: QualityIssueSeverity.Minor,
        message: "Koordinat veya harita bağlantısı eksik.",
        field: "location.coordinates",
      }),
    );
  }

  return {
    earned: Math.min(max, earned),
    complete: Boolean(loc.cityId && loc.districtId && loc.address),
    missingFields,
    issues,
  };
}

function evalDescription(institution: Institution): DimensionEval {
  const max = QUALITY_DIMENSION_WEIGHTS[QualityDimension.Description];
  const missingFields: string[] = [];
  const issues: QualityIssue[] = [];
  let earned = 0;
  const shortOk = institution.shortDescription.trim().length >= 20;
  const longOk = Boolean(
    institution.longDescription?.trim() && institution.longDescription.trim().length >= 80,
  );

  if (shortOk) earned += 7;
  else {
    missingFields.push("shortDescription");
    issues.push(
      createQualityIssue({
        code: "thin_short_description",
        dimension: QualityDimension.Description,
        severity: QualityIssueSeverity.Major,
        message: "Kısa açıklama yetersiz veya eksik.",
        field: "shortDescription",
      }),
    );
  }

  if (longOk) earned += 5;
  else {
    missingFields.push("longDescription");
    issues.push(
      createQualityIssue({
        code: "missing_long_description",
        dimension: QualityDimension.Description,
        severity: QualityIssueSeverity.Minor,
        message: "Detaylı açıklama eksik.",
        field: "longDescription",
      }),
    );
  }

  return { earned: Math.min(max, earned), complete: shortOk && longOk, missingFields, issues };
}

function evalGallery(institution: Institution): DimensionEval {
  const max = QUALITY_DIMENSION_WEIGHTS[QualityDimension.Gallery];
  const missingFields: string[] = [];
  const issues: QualityIssue[] = [];
  let earned = 0;

  if (institution.coverImageUrl?.trim()) earned += 8;
  else {
    missingFields.push("coverImageUrl");
    issues.push(
      createQualityIssue({
        code: "missing_cover_image",
        dimension: QualityDimension.Gallery,
        severity: QualityIssueSeverity.Major,
        message: "Kapak / galeri görseli eksik.",
        field: "coverImageUrl",
      }),
    );
  }

  return { earned: Math.min(max, earned), complete: earned === max, missingFields, issues };
}

function hasProgramsContent(institution: Institution): boolean {
  return (
    Boolean(institution.programsSummary?.trim()) ||
    (institution.educationPrograms?.length ?? 0) > 0
  );
}

function hasAgeOrLevelContent(institution: Institution): boolean {
  return (
    Boolean(institution.ageOrLevelFocus?.trim()) ||
    (institution.educationPrograms?.length ?? 0) > 0
  );
}

function evalPrograms(institution: Institution): DimensionEval {
  const max = QUALITY_DIMENSION_WEIGHTS[QualityDimension.Programs];
  const missingFields: string[] = [];
  const issues: QualityIssue[] = [];
  const hasPrograms = hasProgramsContent(institution);
  const earned = hasPrograms ? max : 0;

  if (!hasPrograms) {
    missingFields.push("programsSummary");
    issues.push(
      createQualityIssue({
        code: "missing_programs",
        dimension: QualityDimension.Programs,
        severity: QualityIssueSeverity.Major,
        message: "Program özeti veya eğitim programı seçimi eksik.",
        field: "programsSummary",
      }),
    );
  }

  return { earned, complete: hasPrograms, missingFields, issues };
}

function evalVerification(institution: Institution): DimensionEval {
  const max = QUALITY_DIMENSION_WEIGHTS[QualityDimension.Verification];
  const missingFields: string[] = [];
  const issues: QualityIssue[] = [];
  let earned = 0;

  switch (institution.verification) {
    case InstitutionVerification.Verified:
      earned = max;
      break;
    case InstitutionVerification.Pending:
      earned = 8;
      issues.push(
        createQualityIssue({
          code: "verification_pending",
          dimension: QualityDimension.Verification,
          severity: QualityIssueSeverity.Minor,
          message: "Sahiplenme doğrulaması beklemede.",
          field: "verification",
        }),
      );
      break;
    case InstitutionVerification.Revoked:
      earned = 0;
      missingFields.push("verification");
      issues.push(
        createQualityIssue({
          code: "verification_revoked",
          dimension: QualityDimension.Verification,
          severity: QualityIssueSeverity.Critical,
          message: "Doğrulama iptal edilmiş.",
          field: "verification",
        }),
      );
      break;
    default:
      earned = 0;
      missingFields.push("verification");
      issues.push(
        createQualityIssue({
          code: "verification_unclaimed",
          dimension: QualityDimension.Verification,
          severity: QualityIssueSeverity.Major,
          message: "Kurum henüz doğrulanmamış / sahiplenilmemiş.",
          field: "verification",
        }),
      );
  }

  return {
    earned: Math.min(max, earned),
    complete: institution.verification === InstitutionVerification.Verified,
    missingFields,
    issues,
  };
}

function evalCategories(institution: Institution): DimensionEval {
  const max = QUALITY_DIMENSION_WEIGHTS[QualityDimension.Categories];
  const missingFields: string[] = [];
  const issues: QualityIssue[] = [];
  let earned = 4; // primaryType always present on valid Institution
  const hasAge = hasAgeOrLevelContent(institution);
  const hasPrograms = hasProgramsContent(institution);

  if (hasAge) earned += 2;
  else {
    missingFields.push("ageOrLevelFocus");
    issues.push(
      createQualityIssue({
        code: "missing_age_focus",
        dimension: QualityDimension.Categories,
        severity: QualityIssueSeverity.Minor,
        message: "Yaş / seviye odağı veya eğitim programı seçimi eksik.",
        field: "ageOrLevelFocus",
      }),
    );
  }

  if (hasPrograms) earned += 2;
  else {
    missingFields.push("categories");
    issues.push(
      createQualityIssue({
        code: "missing_categories",
        dimension: QualityDimension.Categories,
        severity: QualityIssueSeverity.Major,
        message: "Kategori / program sınıflandırması yetersiz.",
        field: "programsSummary",
      }),
    );
  }

  return {
    earned: Math.min(max, earned),
    complete: hasAge && hasPrograms,
    missingFields,
    issues,
  };
}

function evalWebsite(institution: Institution): DimensionEval {
  const max = QUALITY_DIMENSION_WEIGHTS[QualityDimension.Website];
  const hasWebsite = Boolean(institution.socialLinks.websiteUrl?.trim());
  const missingFields: string[] = [];
  const issues: QualityIssue[] = [];

  if (!hasWebsite) {
    missingFields.push("socialLinks.websiteUrl");
    issues.push(
      createQualityIssue({
        code: "missing_website",
        dimension: QualityDimension.Website,
        severity: QualityIssueSeverity.Major,
        message: "Web sitesi eksik.",
        field: "socialLinks.websiteUrl",
      }),
    );
  }

  return {
    earned: hasWebsite ? max : 0,
    complete: hasWebsite,
    missingFields,
    issues,
  };
}

function evalSocialLinks(institution: Institution): DimensionEval {
  const max = QUALITY_DIMENSION_WEIGHTS[QualityDimension.SocialLinks];
  const links = institution.socialLinks;
  const socialCount = [
    links.facebookUrl,
    links.instagramUrl,
    links.twitterUrl,
    links.youtubeUrl,
    links.linkedinUrl,
  ].filter((value) => Boolean(value?.trim())).length;

  const missingFields: string[] = [];
  const issues: QualityIssue[] = [];
  let earned = 0;

  if (socialCount >= 1) earned = max;
  else {
    missingFields.push("socialLinks");
    issues.push(
      createQualityIssue({
        code: "missing_social_links",
        dimension: QualityDimension.SocialLinks,
        severity: QualityIssueSeverity.Minor,
        message: "Sosyal medya bağlantıları eksik.",
        field: "socialLinks",
      }),
    );
  }

  return {
    earned: Math.min(max, earned),
    complete: socialCount >= 1,
    missingFields,
    issues,
  };
}
