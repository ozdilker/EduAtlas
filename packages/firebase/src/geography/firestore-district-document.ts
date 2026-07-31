/**
 * Firestore document shape for `districts` collection.
 */
export type FirestoreDistrictDocument = {
  cityId: string;
  nameTr: string;
  slug: string;
  lifecycleStatus: string;
  nameEn?: string;
  seoIntroHtml?: string;
  sortOrder: number;
  statistics: {
    institutionCount: number;
    publishedInstitutionCount: number;
    claimedInstitutionCount: number;
  };
  createdAt: string;
  updatedAt: string;
};

export const DISTRICTS_COLLECTION = "districts";
