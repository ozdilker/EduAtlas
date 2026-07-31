import { cn } from "../lib/cn";

export type InstitutionLocationProps = {
  address: string;
  city: string;
  district: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  className?: string;
};

/**
 * Builds a Google Maps search query from street address + district + city.
 */
export function buildInstitutionMapsQuery(
  address: string,
  district: string,
  city: string,
): string {
  const parts = [address.trim(), district.trim(), city.trim()].filter(Boolean);
  const unique: string[] = [];

  for (const part of parts) {
    const key = part.toLocaleLowerCase("tr-TR");
    const alreadyIncluded = unique.some((existing) =>
      existing.toLocaleLowerCase("tr-TR").includes(key),
    );
    if (alreadyIncluded) {
      continue;
    }
    unique.push(part);
  }

  return unique.join(", ");
}

/**
 * Public Google Maps search URL for a free-text location query.
 */
export function buildGoogleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Embeddable Google Maps URL (no API key) from query or coordinates.
 */
export function buildGoogleMapsEmbedUrl(
  query: string,
  latitude?: number,
  longitude?: number,
): string {
  if (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude)
  ) {
    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}

/**
 * Location block: address text + embedded map resolved from the address.
 */
export function InstitutionLocation({
  address,
  city,
  district,
  googleMapsUrl,
  latitude,
  longitude,
  className,
}: InstitutionLocationProps) {
  const query = buildInstitutionMapsQuery(address, district, city);
  const ownerMapsUrl = googleMapsUrl?.trim() || undefined;
  const mapsHref = ownerMapsUrl || (query ? buildGoogleMapsSearchUrl(query) : undefined);
  const embedSrc = query
    ? buildGoogleMapsEmbedUrl(query, latitude, longitude)
    : undefined;
  const fromAddress = !ownerMapsUrl && Boolean(query);

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-location", className)}
      aria-labelledby="institution-location-heading"
    >
      <h2 id="institution-location-heading" className="ea-profile-section__title">
        Konum
      </h2>
      <p className="ea-profile-location__address">{address}</p>
      <p className="ea-profile-location__meta">
        {district}, {city}
      </p>
      {embedSrc && mapsHref ? (
        <div className="ea-profile-location__map ea-profile-location__map--embedded">
          <iframe
            className="ea-profile-location__iframe"
            title={`${address} haritası`}
            src={embedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="ea-profile-location__map-actions">
            <a
              className="ea-profile-location__maps-link"
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Maps’te aç
            </a>
            <p className="ea-profile-location__map-hint">
              {fromAddress
                ? "Konum adresten otomatik bulundu"
                : "Konum bağlantısı kurum tarafından eklendi"}
            </p>
          </div>
        </div>
      ) : mapsHref ? (
        <div className="ea-profile-location__map ea-profile-location__map--linked">
          <a
            className="ea-profile-location__maps-link"
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Maps’te aç
          </a>
          <p className="ea-profile-location__map-hint">
            {fromAddress
              ? "Konum adresten otomatik bulundu"
              : "Konum bağlantısı kurum tarafından eklendi"}
          </p>
        </div>
      ) : (
        <div
          className="ea-profile-location__map"
          role="img"
          aria-label="Harita henüz eklenmedi"
        >
          <p className="ea-profile-location__map-label">Harita henüz eklenmedi</p>
        </div>
      )}
    </section>
  );
}
