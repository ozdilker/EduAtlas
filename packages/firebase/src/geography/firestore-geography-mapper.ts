import {
  type City,
  cityIdAsString,
  createCity,
  createDistrict,
  type District,
  districtIdAsString,
} from "@eduatlas/domain";
import type { FirestoreCityDocument } from "./firestore-city-document";
import type { FirestoreDistrictDocument } from "./firestore-district-document";

export const FirestoreCityMapper = {
  toDomain(id: string, data: FirestoreCityDocument): City {
    return createCity({
      id,
      nameTr: data.nameTr,
      slug: data.slug,
      plateCode: data.plateCode,
      lifecycleStatus: data.lifecycleStatus,
      nameEn: data.nameEn,
      sortOrder: data.sortOrder,
      isPriority: data.isPriority,
      seoIntroHtml: data.seoIntroHtml,
      districtCount: data.statistics.districtCount,
      institutionCount: data.statistics.institutionCount,
      publishedInstitutionCount: data.statistics.publishedInstitutionCount,
      claimedInstitutionCount: data.statistics.claimedInstitutionCount,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  },

  toFirestore(city: City): FirestoreCityDocument {
    return {
      nameTr: city.nameTr,
      slug: city.slug,
      plateCode: city.plateCode,
      lifecycleStatus: city.lifecycleStatus,
      ...(city.nameEn ? { nameEn: city.nameEn } : {}),
      sortOrder: city.sortOrder,
      isPriority: city.isPriority,
      ...(city.seoIntroHtml ? { seoIntroHtml: city.seoIntroHtml } : {}),
      statistics: {
        institutionCount: city.statistics.institutionCount,
        publishedInstitutionCount: city.statistics.publishedInstitutionCount,
        claimedInstitutionCount: city.statistics.claimedInstitutionCount,
        districtCount: city.statistics.districtCount,
      },
      createdAt: city.createdAt,
      updatedAt: city.updatedAt,
    };
  },

  cityDocId(city: City): string {
    return cityIdAsString(city.id);
  },
};

export const FirestoreDistrictMapper = {
  toDomain(id: string, data: FirestoreDistrictDocument): District {
    return createDistrict({
      id,
      cityId: data.cityId,
      nameTr: data.nameTr,
      slug: data.slug,
      lifecycleStatus: data.lifecycleStatus,
      nameEn: data.nameEn,
      seoIntroHtml: data.seoIntroHtml,
      sortOrder: data.sortOrder,
      institutionCount: data.statistics.institutionCount,
      publishedInstitutionCount: data.statistics.publishedInstitutionCount,
      claimedInstitutionCount: data.statistics.claimedInstitutionCount,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  },

  toFirestore(district: District): FirestoreDistrictDocument {
    return {
      cityId: district.cityId.value,
      nameTr: district.nameTr,
      slug: district.slug,
      lifecycleStatus: district.lifecycleStatus,
      ...(district.nameEn ? { nameEn: district.nameEn } : {}),
      ...(district.seoIntroHtml ? { seoIntroHtml: district.seoIntroHtml } : {}),
      sortOrder: district.sortOrder,
      statistics: {
        institutionCount: district.statistics.institutionCount,
        publishedInstitutionCount: district.statistics.publishedInstitutionCount,
        claimedInstitutionCount: district.statistics.claimedInstitutionCount,
      },
      createdAt: district.createdAt,
      updatedAt: district.updatedAt,
    };
  },

  districtDocId(district: District): string {
    return districtIdAsString(district.id);
  },
};
