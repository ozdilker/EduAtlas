import type { District, GeoLifecycleStatus } from "@eduatlas/domain";

export type DistrictListOptions = Readonly<{
  readonly query?: string;
  readonly lifecycleStatus?: GeoLifecycleStatus;
}>;

/**
 * Persistence port for District reference data.
 * Infrastructure adapters implement this — no Firebase in this package.
 */
export interface DistrictRepository {
  getById(id: string): Promise<District | null>;
  getBySlug(cityId: string, slug: string): Promise<District | null>;
  listByCityId(cityId: string, options?: DistrictListOptions): Promise<readonly District[]>;
  search(query: string, cityId?: string): Promise<readonly District[]>;
}
