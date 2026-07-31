import type { InstitutionCardViewData } from "../institution/institution-card-content";

export type InstitutionBreadcrumbItem = {
  id: string;
  label: string;
  href?: string;
};

export type InstitutionQuickFact = {
  id: string;
  label: string;
  value: string;
};

export type InstitutionHighlight = {
  id: string;
  title: string;
  description: string;
};

export type InstitutionProgramItem = {
  id: string;
  name: string;
  summary?: string;
  audience?: string;
};

export type InstitutionAmenityItem = {
  id: string;
  label: string;
};

export type InstitutionWorkingHoursDay = {
  id: string;
  label: string;
  isOpen: boolean;
  hoursLabel?: string;
};

export type InstitutionGalleryItem = {
  id: string;
  label: string;
  /** Public image URL when available; otherwise UI shows a placeholder. */
  imageUrl?: string;
};

export type InstitutionContactItem = {
  id: string;
  label: string;
  value: string;
  href?: string;
};

export type InstitutionSocialLinkItem = {
  id: string;
  label: string;
  value: string;
  href: string;
};

export type InstitutionProfileViewData = {
  id: string;
  slug: string;
  name: string;
  typeLabel: string;
  city: string;
  cityHref: string;
  district: string;
  districtHref: string;
  typeHref: string;
  verified: boolean;
  premium: boolean;
  featured: boolean;
  summary: string;
  /** Optional long-form description shown in its own section above highlights. */
  longDescription?: string;
  address: string;
  /** Google Maps link from owner profile (optional). */
  googleMapsUrl?: string;
  /** Optional coordinates when available. */
  latitude?: number;
  longitude?: number;
  /** Institution-uploaded logo URL (optional). */
  logoUrl?: string;
  /** Institution-uploaded cover image URL (optional). */
  coverImageUrl?: string;
  /** Public brochure / PDF URL (optional). */
  brochurePdfUrl?: string;
  breadcrumbs: InstitutionBreadcrumbItem[];
  quickFacts: InstitutionQuickFact[];
  highlights: InstitutionHighlight[];
  programs: InstitutionProgramItem[];
  amenities: InstitutionAmenityItem[];
  workingHours: InstitutionWorkingHoursDay[];
  gallery: InstitutionGalleryItem[];
  contact: InstitutionContactItem[];
  socialLinks: InstitutionSocialLinkItem[];
  related: InstitutionCardViewData[];
};

/**
 * Static presentation profile for UI-only institution pages.
 */
export function getStaticInstitutionProfile(slug = "ornek-anaokulu"): InstitutionProfileViewData {
  return {
    id: "static-profile-1",
    slug,
    name: "Örnek Anaokulu",
    typeLabel: "Anaokulu",
    city: "İstanbul",
    cityHref: "/cities/istanbul",
    district: "Kadıköy",
    districtHref: "/cities/istanbul/kadikoy",
    typeHref: "/categories/anaokulu",
    verified: true,
    premium: true,
    featured: false,
    summary:
      "Aileler için hazırlanmış statik kurum profili. Bu sayfa yalnızca arayüz yer tutucusudur; canlı veri veya form gönderimi yoktur.",
    longDescription:
      "Okul öncesi eğitimde dengeli gelişimi destekleyen programlar, güvenli kampüs ve aile ile yakın iletişim bu kurumun temel yaklaşımıdır.",
    address: "Caferağa Mah. Örnek Sok. No:1, Kadıköy / İstanbul",
    breadcrumbs: [
      { id: "home", label: "Ana sayfa", href: "/" },
      { id: "city", label: "İstanbul", href: "/cities/istanbul" },
      { id: "district", label: "Kadıköy", href: "/cities/istanbul/kadikoy" },
      { id: "type", label: "Anaokulu", href: "/categories/anaokulu" },
      { id: "current", label: "Örnek Anaokulu" },
    ],
    quickFacts: [
      { id: "type", label: "Kurum türü", value: "Anaokulu" },
      { id: "age", label: "Yaş aralığı", value: "24–72 ay" },
      { id: "language", label: "Eğitim dili", value: "Türkçe / İngilizce" },
      { id: "hours", label: "Çalışma saatleri", value: "08:00 – 18:00" },
      { id: "transport", label: "Servis", value: "Var" },
      { id: "founded", label: "Kuruluş", value: "2012" },
    ],
    highlights: [
      {
        id: "campus",
        title: "Güvenli kampüs",
        description: "Kapalı bahçe ve kontrollü giriş alanları.",
      },
      {
        id: "approach",
        title: "Eğitim yaklaşımı",
        description: "Okul öncesi gelişimi destekleyen dengeli program anlayışı.",
      },
      {
        id: "activities",
        title: "Zengin etkinlikler",
        description: "Sanat, müzik ve açık hava aktiviteleri.",
      },
    ],
    programs: [
      {
        id: "full-day",
        name: "Tam gün programı",
      },
      {
        id: "half-day",
        name: "Yarım gün programı",
      },
      {
        id: "english",
        name: "Erken İngilizce",
      },
    ],
    amenities: [
      { id: "shuttle", label: "Servis" },
      { id: "parking", label: "Otopark" },
      { id: "security", label: "Güvenlik" },
      { id: "library", label: "Kütüphane" },
    ],
    workingHours: [
      { id: "monday", label: "Pazartesi", isOpen: true, hoursLabel: "08:00 – 18:00" },
      { id: "tuesday", label: "Salı", isOpen: true, hoursLabel: "08:00 – 18:00" },
      { id: "wednesday", label: "Çarşamba", isOpen: true, hoursLabel: "08:00 – 18:00" },
      { id: "thursday", label: "Perşembe", isOpen: true, hoursLabel: "08:00 – 18:00" },
      { id: "friday", label: "Cuma", isOpen: true, hoursLabel: "08:00 – 18:00" },
      { id: "saturday", label: "Cumartesi", isOpen: false },
      { id: "sunday", label: "Pazar", isOpen: false },
    ],
    gallery: [
      { id: "g1", label: "Bahçe görünümü", imageUrl: "/brand/logo.png" },
      { id: "g2", label: "Sınıf alanı" },
      { id: "g3", label: "Oyun köşesi" },
      { id: "g4", label: "Yemek alanı" },
    ],
    contact: [
      {
        id: "phone",
        label: "Telefon",
        value: "+90 216 000 00 00",
        href: "tel:+902160000000",
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        value: "Mesaj gönder",
        href: "https://wa.me/902160000000",
      },
      {
        id: "email",
        label: "E-posta",
        value: "info@ornek-anaokulu.example",
        href: "mailto:info@ornek-anaokulu.example",
      },
      {
        id: "web",
        label: "Web sitesi",
        value: "ornek-anaokulu.example",
        href: "https://ornek-anaokulu.example",
      },
    ],
    socialLinks: [
      {
        id: "instagram",
        label: "Instagram",
        value: "instagram.com/ornekanaokulu",
        href: "https://instagram.com/ornekanaokulu",
      },
      {
        id: "facebook",
        label: "Facebook",
        value: "facebook.com/ornekanaokulu",
        href: "https://facebook.com/ornekanaokulu",
      },
    ],
    related: [
      {
        id: "related-1",
        name: "Komşu Anaokulu",
        href: "/institutions/komsu-anaokulu",
        typeLabel: "Anaokulu",
        city: "İstanbul",
        district: "Kadıköy",
        snippet: "Yakındaki benzer kurum örneği.",
        badges: { verified: true },
        ctaLabel: "İncele",
      },
      {
        id: "related-2",
        name: "Örnek Kreş",
        href: "/institutions/ornek-kres",
        typeLabel: "Kreş",
        city: "İstanbul",
        district: "Moda",
        snippet: "İlçedeki alternatif kurum örneği.",
        badges: { premium: true },
        ctaLabel: "İncele",
      },
      {
        id: "related-3",
        name: "Sahil Dil Okulu",
        href: "/institutions/sahil-dil-okulu",
        typeLabel: "Dil Kursu",
        city: "İstanbul",
        district: "Caddebostan",
        snippet: "İlgili kurum önerisi (statik).",
        badges: { featured: true },
        ctaLabel: "İncele",
      },
    ],
  };
}
