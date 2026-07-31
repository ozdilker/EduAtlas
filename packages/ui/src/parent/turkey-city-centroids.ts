/**
 * Approximate provincial capital centroids for browser GPS → nearest city.
 * Keys match geography catalog city ids (slugs).
 */
export type CityCentroid = Readonly<{
  readonly cityId: string;
  readonly latitude: number;
  readonly longitude: number;
}>;

export const TURKEY_CITY_CENTROIDS: readonly CityCentroid[] = Object.freeze([
  Object.freeze({ cityId: "adana", latitude: 37.0, longitude: 35.3213 }),
  Object.freeze({ cityId: "adiyaman", latitude: 37.7648, longitude: 38.2786 }),
  Object.freeze({ cityId: "afyonkarahisar", latitude: 38.7507, longitude: 30.5567 }),
  Object.freeze({ cityId: "agri", latitude: 39.7191, longitude: 43.0503 }),
  Object.freeze({ cityId: "aksaray", latitude: 38.3687, longitude: 34.037 }),
  Object.freeze({ cityId: "amasya", latitude: 40.6499, longitude: 35.8353 }),
  Object.freeze({ cityId: "ankara", latitude: 39.9334, longitude: 32.8597 }),
  Object.freeze({ cityId: "antalya", latitude: 36.8969, longitude: 30.7133 }),
  Object.freeze({ cityId: "ardahan", latitude: 41.1105, longitude: 42.7022 }),
  Object.freeze({ cityId: "artvin", latitude: 41.1828, longitude: 41.8183 }),
  Object.freeze({ cityId: "aydin", latitude: 37.856, longitude: 27.8416 }),
  Object.freeze({ cityId: "balikesir", latitude: 39.6484, longitude: 27.8826 }),
  Object.freeze({ cityId: "bartin", latitude: 41.6358, longitude: 32.3375 }),
  Object.freeze({ cityId: "batman", latitude: 37.8812, longitude: 41.1351 }),
  Object.freeze({ cityId: "bayburt", latitude: 40.2552, longitude: 40.2249 }),
  Object.freeze({ cityId: "bilecik", latitude: 40.1506, longitude: 29.9793 }),
  Object.freeze({ cityId: "bingol", latitude: 38.8855, longitude: 40.4966 }),
  Object.freeze({ cityId: "bitlis", latitude: 38.4006, longitude: 42.1095 }),
  Object.freeze({ cityId: "bolu", latitude: 40.735, longitude: 31.6061 }),
  Object.freeze({ cityId: "burdur", latitude: 37.7203, longitude: 30.2908 }),
  Object.freeze({ cityId: "bursa", latitude: 40.1885, longitude: 29.061 }),
  Object.freeze({ cityId: "canakkale", latitude: 40.1553, longitude: 26.4142 }),
  Object.freeze({ cityId: "cankiri", latitude: 40.6013, longitude: 33.6135 }),
  Object.freeze({ cityId: "corum", latitude: 40.5506, longitude: 34.9556 }),
  Object.freeze({ cityId: "denizli", latitude: 37.7765, longitude: 29.0864 }),
  Object.freeze({ cityId: "diyarbakir", latitude: 37.9144, longitude: 40.2306 }),
  Object.freeze({ cityId: "duzce", latitude: 40.8438, longitude: 31.1565 }),
  Object.freeze({ cityId: "edirne", latitude: 41.6771, longitude: 26.5557 }),
  Object.freeze({ cityId: "elazig", latitude: 38.681, longitude: 39.2264 }),
  Object.freeze({ cityId: "erzincan", latitude: 39.75, longitude: 39.5 }),
  Object.freeze({ cityId: "erzurum", latitude: 39.9043, longitude: 41.2679 }),
  Object.freeze({ cityId: "eskisehir", latitude: 39.7767, longitude: 30.5206 }),
  Object.freeze({ cityId: "gaziantep", latitude: 37.0662, longitude: 37.3833 }),
  Object.freeze({ cityId: "giresun", latitude: 40.9128, longitude: 38.3895 }),
  Object.freeze({ cityId: "gumushane", latitude: 40.4603, longitude: 39.4817 }),
  Object.freeze({ cityId: "hakkari", latitude: 37.5744, longitude: 43.7408 }),
  Object.freeze({ cityId: "hatay", latitude: 36.4018, longitude: 36.3498 }),
  Object.freeze({ cityId: "igdir", latitude: 39.888, longitude: 44.0048 }),
  Object.freeze({ cityId: "isparta", latitude: 37.7648, longitude: 30.5566 }),
  Object.freeze({ cityId: "istanbul", latitude: 41.0082, longitude: 28.9784 }),
  Object.freeze({ cityId: "izmir", latitude: 38.4237, longitude: 27.1428 }),
  Object.freeze({ cityId: "kahramanmaras", latitude: 37.5858, longitude: 36.9371 }),
  Object.freeze({ cityId: "karabuk", latitude: 41.2061, longitude: 32.6204 }),
  Object.freeze({ cityId: "karaman", latitude: 37.181, longitude: 33.215 }),
  Object.freeze({ cityId: "kars", latitude: 40.6013, longitude: 43.0975 }),
  Object.freeze({ cityId: "kastamonu", latitude: 41.3887, longitude: 33.7827 }),
  Object.freeze({ cityId: "kayseri", latitude: 38.7312, longitude: 35.4787 }),
  Object.freeze({ cityId: "kirikkale", latitude: 39.8468, longitude: 33.5153 }),
  Object.freeze({ cityId: "kirklareli", latitude: 41.7355, longitude: 27.2256 }),
  Object.freeze({ cityId: "kirsehir", latitude: 39.1425, longitude: 34.1709 }),
  Object.freeze({ cityId: "kilis", latitude: 36.7184, longitude: 37.1212 }),
  Object.freeze({ cityId: "kocaeli", latitude: 40.8533, longitude: 29.8815 }),
  Object.freeze({ cityId: "konya", latitude: 37.8746, longitude: 32.4932 }),
  Object.freeze({ cityId: "kutahya", latitude: 39.4242, longitude: 29.9833 }),
  Object.freeze({ cityId: "malatya", latitude: 38.3552, longitude: 38.3095 }),
  Object.freeze({ cityId: "manisa", latitude: 38.6191, longitude: 27.4289 }),
  Object.freeze({ cityId: "mardin", latitude: 37.3212, longitude: 40.7245 }),
  Object.freeze({ cityId: "mersin", latitude: 36.8121, longitude: 34.6415 }),
  Object.freeze({ cityId: "mugla", latitude: 37.2153, longitude: 28.3636 }),
  Object.freeze({ cityId: "mus", latitude: 38.7348, longitude: 41.491 }),
  Object.freeze({ cityId: "nevsehir", latitude: 38.6939, longitude: 34.6857 }),
  Object.freeze({ cityId: "nigde", latitude: 37.9667, longitude: 34.6833 }),
  Object.freeze({ cityId: "ordu", latitude: 40.9839, longitude: 37.8764 }),
  Object.freeze({ cityId: "osmaniye", latitude: 37.0742, longitude: 36.2478 }),
  Object.freeze({ cityId: "rize", latitude: 41.0201, longitude: 40.5234 }),
  Object.freeze({ cityId: "sakarya", latitude: 40.7889, longitude: 30.4053 }),
  Object.freeze({ cityId: "samsun", latitude: 41.2867, longitude: 36.33 }),
  Object.freeze({ cityId: "siirt", latitude: 37.9333, longitude: 41.95 }),
  Object.freeze({ cityId: "sinop", latitude: 42.0231, longitude: 35.1531 }),
  Object.freeze({ cityId: "sivas", latitude: 39.7477, longitude: 37.0179 }),
  Object.freeze({ cityId: "sanliurfa", latitude: 37.1591, longitude: 38.7969 }),
  Object.freeze({ cityId: "sirnak", latitude: 37.5164, longitude: 42.4611 }),
  Object.freeze({ cityId: "tekirdag", latitude: 40.9833, longitude: 27.5167 }),
  Object.freeze({ cityId: "tokat", latitude: 40.3167, longitude: 36.55 }),
  Object.freeze({ cityId: "trabzon", latitude: 41.0015, longitude: 39.7178 }),
  Object.freeze({ cityId: "tunceli", latitude: 39.1079, longitude: 39.5401 }),
  Object.freeze({ cityId: "usak", latitude: 38.6823, longitude: 29.4082 }),
  Object.freeze({ cityId: "van", latitude: 38.4891, longitude: 43.4089 }),
  Object.freeze({ cityId: "yalova", latitude: 40.65, longitude: 29.2667 }),
  Object.freeze({ cityId: "yozgat", latitude: 39.8181, longitude: 34.8147 }),
  Object.freeze({ cityId: "zonguldak", latitude: 41.4564, longitude: 31.7987 }),
]);

const EARTH_RADIUS_KM = 6371;

/**
 * Great-circle distance in kilometers between two WGS84 points.
 */
export function haversineDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(latitudeB - latitudeA);
  const dLon = toRad(longitudeB - longitudeA);
  const lat1 = toRad(latitudeA);
  const lat2 = toRad(latitudeB);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Returns the catalog city id closest to the given coordinates.
 */
export function findNearestCityId(
  latitude: number,
  longitude: number,
  centroids: readonly CityCentroid[] = TURKEY_CITY_CENTROIDS,
): string | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || centroids.length === 0) {
    return null;
  }

  let bestId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const city of centroids) {
    const distance = haversineDistanceKm(
      latitude,
      longitude,
      city.latitude,
      city.longitude,
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = city.cityId;
    }
  }
  return bestId;
}
