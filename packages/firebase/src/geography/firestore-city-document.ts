/**
 * Firestore document shape for `cities` collection.
 */
export type FirestoreCityDocument = {
  nameTr: string;
  slug: string;
  plateCode: string;
  lifecycleStatus: string;
  nameEn?: string;
  sortOrder: number;
  isPriority: boolean;
  seoIntroHtml?: string;
  statistics: {
    institutionCount: number;
    publishedInstitutionCount: number;
    claimedInstitutionCount: number;
    districtCount: number;
  };
  createdAt: string;
  updatedAt: string;
};

export const CITIES_COLLECTION = "cities";
