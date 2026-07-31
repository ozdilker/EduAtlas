/**
 * Seeds Firestore `cities` + `districts` with official Türkiye geography.
 * Geography only — no institutions.
 *
 * Usage: npx tsx packages/firebase/scripts/seed-geography-collections.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getGeographyCatalogSummary, listCities, listDistricts } from "@eduatlas/application";
import {
  CITIES_COLLECTION,
  createFirestoreCityRepository,
  createFirestoreDistrictRepository,
  DISTRICTS_COLLECTION,
  getAdminFirestore,
  seedGeographyCollections,
} from "../src/server/index";

const envPath = resolve("apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) continue;
  const key = trimmed.slice(0, eq);
  let value = trimmed.slice(eq + 1);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

const firestore = getAdminFirestore();
const result = await seedGeographyCollections(firestore);

const cityRepository = createFirestoreCityRepository(firestore);
const districtRepository = createFirestoreDistrictRepository(firestore);

const cities = await listCities({}, { cityRepository });
const istanbulDistricts = await listDistricts({ cityId: "istanbul" }, { districtRepository });
const summary = await getGeographyCatalogSummary({ cityRepository, districtRepository });

const citySample = await firestore.collection(CITIES_COLLECTION).doc("istanbul").get();
const districtSample = await firestore
  .collection(DISTRICTS_COLLECTION)
  .doc("istanbul-kadikoy")
  .get();

const payload = {
  ...result,
  listedCityCount: cities.length,
  istanbulDistrictCount: istanbulDistricts.length,
  summary,
  sampleCityExists: citySample.exists,
  sampleDistrictExists: districtSample.exists,
  sampleCityPlate: citySample.data()?.plateCode ?? null,
  institutionFieldsAbsent: !("institutionId" in (citySample.data() ?? {})),
};

console.log(JSON.stringify(payload, null, 2));

if (result.citiesWritten !== 81) {
  throw new Error(`Expected 81 cities, wrote ${result.citiesWritten}`);
}
if (result.districtsWritten !== 973) {
  throw new Error(`Expected 973 districts, wrote ${result.districtsWritten}`);
}
if (!citySample.exists || !districtSample.exists) {
  throw new Error("Sample geography documents missing after seed.");
}
if (summary.statistics.institutionCount !== 0) {
  throw new Error("Geography seed must keep institution statistics at zero.");
}
