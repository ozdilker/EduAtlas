/**
 * Firestore document shape for `institutions` collection.
 * Field names follow FIREBASE-ARCHITECTURE / DOMAIN-MODEL.
 */
export type FirestoreInstitutionDocument = {
  name: string;
  slug: string;
  primaryTypeId: string;
  lifecycleStatus: string;
  claimStatus: string;
  cityId: string;
  districtId: string;
  address: string;
  locationNotes?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  geohash?: string;
  contactPhone?: string;
  contactEmail?: string;
  whatsappNumber?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  shortDescription: string;
  longDescription?: string;
  programsSummary?: string;
  ageOrLevelFocus?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  /** Public gallery image download URLs only. */
  galleryImages?: string[];
  /**
   * Weekly hours keyed by weekday.
   * Example: `{ monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" } }`
   */
  workingHours?: Record<
    string,
    {
      isOpen: boolean;
      openTime?: string;
      closeTime?: string;
    }
  >;
  /** Canonical YouTube or Vimeo promotional video URL. */
  promoVideoUrl?: string;
  /** Brochure / PDF download URL only. */
  brochurePdfUrl?: string;
  /** Selected amenity ids from the catalog. */
  amenities?: string[];
  /** Selected education program ids from the catalog. */
  educationPrograms?: string[];
  /** Ordered FAQ items. */
  faqs?: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  isPremium: boolean;
  qualityScore: number;
  /** Turkish-folded name for Firestore fallback keyword search. */
  nameFolded: string;
  /** Search tokens (FIREBASE-ARCHITECTURE / SEARCH-ARCHITECTURE). */
  searchKeywords: string[];
  /** Denormalized geo labels for search projections (until cities collection). */
  cityName?: string;
  districtName?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Last editor user id (audit). */
  updatedByUserId?: string;

  /**
   * Denormalized lead counters for owner surfaces.
   * Populated by Firestore triggers (or equivalent write-time fanout).
   */
  leadCounters?: {
    total: number;
    pending: number;
    byStatus: {
      new: number;
      read: number;
      contacted: number;
      appointment: number;
      enrolled: number;
      lost: number;
      closed: number;
      spam: number;
    };
    byPipeline: {
      new: number;
      contacted: number;
      appointment: number;
      enrolled: number;
      lost: number;
    };
  };
};

export const INSTITUTIONS_COLLECTION = "institutions";
