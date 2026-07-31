export type OwnerDayWorkingHoursFormValue = {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

export type OwnerWorkingHoursFormValue = Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  OwnerDayWorkingHoursFormValue
>;

export type OwnerInstitutionProfileFormValues = {
  institutionId: string;
  institutionName: string;
  publicProfileHref: string;
  logoUrl?: string;
  coverImageUrl?: string;
  galleryImages?: readonly string[];
  brochurePdfUrl?: string;
  amenityOptions: readonly { id: string; label: string; selected: boolean }[];
  educationProgramOptions: readonly { id: string; label: string; selected: boolean }[];
  faqs: readonly { id: string; question: string; answer: string }[];
  highlights: readonly { id: string; title: string; description: string }[];
  workingHours: OwnerWorkingHoursFormValue;
  shortDescription: string;
  longDescription: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  googleMapsUrl: string;
  websiteUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  promoVideoUrl: string;
  updatedAtLabel: string;
  updatedByLabel: string;
};

export type OwnerInstitutionProfileFormState = {
  ok: boolean;
  message: string;
};

export type OwnerInstitutionProfilePageViewData = {
  form: OwnerInstitutionProfileFormValues;
};
