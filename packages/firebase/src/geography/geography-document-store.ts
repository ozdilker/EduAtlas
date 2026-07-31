import type { FirestoreCityDocument } from "./firestore-city-document";
import type { FirestoreDistrictDocument } from "./firestore-district-document";

export type CityDocumentRecord = Readonly<{
  readonly id: string;
  readonly data: FirestoreCityDocument;
}>;

export type DistrictDocumentRecord = Readonly<{
  readonly id: string;
  readonly data: FirestoreDistrictDocument;
}>;

export interface CityDocumentStore {
  getById(id: string): Promise<CityDocumentRecord | null>;
  findBySlug(slug: string): Promise<CityDocumentRecord | null>;
  findByPlateCode(plateCode: string): Promise<CityDocumentRecord | null>;
  listAll(): Promise<readonly CityDocumentRecord[]>;
  upsert(id: string, data: FirestoreCityDocument): Promise<void>;
}

export interface DistrictDocumentStore {
  getById(id: string): Promise<DistrictDocumentRecord | null>;
  findByCityAndSlug(cityId: string, slug: string): Promise<DistrictDocumentRecord | null>;
  listByCityId(cityId: string): Promise<readonly DistrictDocumentRecord[]>;
  listAll(): Promise<readonly DistrictDocumentRecord[]>;
  upsert(id: string, data: FirestoreDistrictDocument): Promise<void>;
}
