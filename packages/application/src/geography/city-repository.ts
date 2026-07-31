import type { City, GeoLifecycleStatus } from "@eduatlas/domain";

export type CityListOptions = Readonly<{
  readonly query?: string;
  readonly isPriority?: boolean;
  readonly lifecycleStatus?: GeoLifecycleStatus;
}>;

/**
 * Persistence port for City reference data.
 * Infrastructure adapters implement this — no Firebase in this package.
 */
export interface CityRepository {
  getById(id: string): Promise<City | null>;
  getBySlug(slug: string): Promise<City | null>;
  getByPlateCode(plateCode: string): Promise<City | null>;
  list(options?: CityListOptions): Promise<readonly City[]>;
  search(query: string): Promise<readonly City[]>;
}
