import type { LeadRepository } from "@eduatlas/application";
import { createLead, LeadRole, LeadStatus, leadIdAsString } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { FirestoreLeadMapper } from "./firestore-lead-mapper";
import { FirestoreLeadRepository } from "./firestore-lead-repository";
import { InMemoryLeadDocumentStore } from "./in-memory-lead-document-store";

function buildLead() {
  return createLead({
    id: "lead_1",
    institutionId: "seed_inst_ist_kolej_1",
    parentName: "Ayşe Yılmaz",
    phone: "+90 532 000 11 22",
    message: "Ücret ve kontenjan hakkında bilgi almak istiyorum.",
    role: LeadRole.Parent,
    status: LeadStatus.New,
    consentAcceptedAt: "2026-07-14T15:00:00.000Z",
    consentPolicyVersion: "kvkk-lead-v1",
    createdAt: "2026-07-14T15:00:00.000Z",
    updatedAt: "2026-07-14T15:00:00.000Z",
  });
}

describe("FirestoreLeadRepository", () => {
  it("round-trips through mapper and repository contracts", async () => {
    const lead = buildLead();
    const document = FirestoreLeadMapper.toFirestore(lead);
    expect(document.institutionId).toBe("seed_inst_ist_kolej_1");
    expect(document.parentName).toBe("Ayşe Yılmaz");

    const repo: LeadRepository = new FirestoreLeadRepository({
      store: new InMemoryLeadDocumentStore(),
    });

    await repo.save(lead);
    expect((await repo.getById(lead.id))?.message).toContain("kontenjan");

    const listed = await repo.listByInstitutionId("seed_inst_ist_kolej_1");
    expect(listed).toHaveLength(1);
    const first = listed[0];
    expect(first).toBeDefined();
    if (first) {
      expect(leadIdAsString(first.id)).toBe("lead_1");
    }

    const contacted = await repo.updateStatus(lead.id, LeadStatus.Appointment);
    expect(contacted.status).toBe(LeadStatus.Appointment);
  });
});
