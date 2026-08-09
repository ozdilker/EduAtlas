import { describe, expect, it } from "vitest";
import {
  decodeAdminInstitutionListCursor,
  encodeAdminInstitutionListCursor,
} from "./admin-institution-list-cursor";

describe("admin institution list cursor", () => {
  it("round-trips name_asc cursor", () => {
    const encoded = encodeAdminInstitutionListCursor({
      sort: "name_asc",
      name: "Örnek Okul",
      id: "inst_1",
    });
    expect(decodeAdminInstitutionListCursor(encoded, "name_asc")).toEqual({
      sort: "name_asc",
      name: "Örnek Okul",
      id: "inst_1",
    });
  });

  it("rejects sort mismatch", () => {
    const encoded = encodeAdminInstitutionListCursor({
      sort: "name_asc",
      name: "A",
      id: "a",
    });
    expect(decodeAdminInstitutionListCursor(encoded, "created_desc")).toBeNull();
  });

  it("rejects malformed payloads", () => {
    expect(decodeAdminInstitutionListCursor("not-valid")).toBeNull();
    expect(decodeAdminInstitutionListCursor("")).toBeNull();
  });
});
