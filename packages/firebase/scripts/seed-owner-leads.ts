/**
 * Ensures ≥10 sample leads for the owner demo institution and validates LeadRepository queries.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createLead, createLeadId, LeadRole, LeadStatus, leadIdAsString } from "@eduatlas/domain";
import {
  createFirestoreLeadRepository,
  getAdminFirestore,
  LEADS_COLLECTION,
} from "../src/server/index";

const OWNER_DEMO_INSTITUTION_ID = "seed_inst_ist_kolej_1";
const MIN_LEADS = 10;

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

const SAMPLE_LEADS = [
  {
    id: "lead_owner_seed_01",
    parentName: "Ayşe Yılmaz",
    phone: "+90 532 111 22 01",
    message: "2026-2027 eğitim yılı için kayıt şartlarını öğrenmek istiyorum.",
    role: LeadRole.Parent,
    status: LeadStatus.New,
    email: "ayse.yilmaz@example.com",
  },
  {
    id: "lead_owner_seed_02",
    parentName: "Mehmet Demir",
    phone: "+90 533 222 33 02",
    message: "Çocuğumuz için İngilizce programı hakkında bilgi alabilir miyiz?",
    role: LeadRole.Parent,
    status: LeadStatus.Read,
  },
  {
    id: "lead_owner_seed_03",
    parentName: "Elif Kaya",
    phone: "+90 534 333 44 03",
    message: "Ücretlendirme ve burs imkanları hakkında görüşmek istiyorum.",
    role: LeadRole.Parent,
    status: LeadStatus.Contacted,
    email: "elif.kaya@example.com",
  },
  {
    id: "lead_owner_seed_04",
    parentName: "Can Öztürk",
    phone: "+90 535 444 55 04",
    message: "Okul ziyareti için uygun bir gün ayarlayabilir misiniz?",
    role: LeadRole.Parent,
    status: LeadStatus.New,
    preferredContactTime: "Cumartesi öğleden sonra",
  },
  {
    id: "lead_owner_seed_05",
    parentName: "Zeynep Arslan",
    phone: "+90 536 555 66 05",
    message: "Lise hazırlık sınıfı kontenjanı var mı?",
    role: LeadRole.Parent,
    status: LeadStatus.Closed,
  },
  {
    id: "lead_owner_seed_06",
    parentName: "Burak Şahin",
    phone: "+90 537 666 77 06",
    message: "Öğrenci olarak yaz okulu programlarınızı soruyorum.",
    role: LeadRole.Student,
    status: LeadStatus.New,
  },
  {
    id: "lead_owner_seed_07",
    parentName: "Selin Aydın",
    phone: "+90 538 777 88 07",
    message: "Rehberlik ve psikolojik danışmanlık hizmetleri hakkında bilgi.",
    role: LeadRole.Parent,
    status: LeadStatus.Read,
  },
  {
    id: "lead_owner_seed_08",
    parentName: "Emre Çelik",
    phone: "+90 539 888 99 08",
    message: "Ulaşım servisi güzergahları nelerdir?",
    role: LeadRole.Other,
    status: LeadStatus.New,
  },
  {
    id: "lead_owner_seed_09",
    parentName: "Deniz Koç",
    phone: "+90 541 999 00 09",
    message: "Özel eğitim destekleri sunuyor musunuz?",
    role: LeadRole.Parent,
    status: LeadStatus.Spam,
  },
  {
    id: "lead_owner_seed_10",
    parentName: "Fatma Aksoy",
    phone: "+90 542 101 12 10",
    message: "Kardeş indirimi ve kayıt takvimi hakkında detay istiyorum.",
    role: LeadRole.Parent,
    status: LeadStatus.Contacted,
    preferredContactTime: "Akşam 18:00 sonrası",
  },
  {
    id: "lead_owner_seed_11",
    parentName: "Hakan Yıldız",
    phone: "+90 543 202 23 11",
    message: "İkinci dönem nakil için süreç nedir?",
    role: LeadRole.Parent,
    status: LeadStatus.New,
  },
] as const;

const firestore = getAdminFirestore();
const leadRepository = createFirestoreLeadRepository(firestore);

let listed = await leadRepository.listByInstitutionId(OWNER_DEMO_INSTITUTION_ID);
const inserted: string[] = [];

if (listed.length < MIN_LEADS) {
  const now = Date.now();
  for (const [index, sample] of SAMPLE_LEADS.entries()) {
    const existing = await leadRepository.getById(createLeadId(sample.id));
    if (existing) {
      continue;
    }

    const createdAt = new Date(now - index * 3_600_000).toISOString();
    const lead = createLead({
      id: sample.id,
      institutionId: OWNER_DEMO_INSTITUTION_ID,
      parentName: sample.parentName,
      phone: sample.phone,
      message: sample.message,
      role: sample.role,
      status: sample.status,
      consentAcceptedAt: createdAt,
      consentPolicyVersion: "kvkk-lead-v1",
      ...("email" in sample && sample.email ? { email: sample.email } : {}),
      ...("preferredContactTime" in sample && sample.preferredContactTime
        ? { preferredContactTime: sample.preferredContactTime }
        : {}),
      createdAt,
      updatedAt: createdAt,
    });

    await leadRepository.save(lead);
    inserted.push(leadIdAsString(lead.id));
  }

  listed = await leadRepository.listByInstitutionId(OWNER_DEMO_INSTITUTION_ID);
}

const sampleId = listed[0] ? leadIdAsString(listed[0].id) : SAMPLE_LEADS[0].id;
const byId = await leadRepository.getById(createLeadId(sampleId));
const collectionCount = (await firestore.collection(LEADS_COLLECTION).count().get()).data().count;

const sortedNewestFirst = listed.every((lead, index) => {
  if (index === 0) return true;
  const previous = listed[index - 1];
  return previous ? previous.createdAt >= lead.createdAt : false;
});

console.log(
  JSON.stringify(
    {
      collection: LEADS_COLLECTION,
      institutionId: OWNER_DEMO_INSTITUTION_ID,
      listedCount: listed.length,
      collectionCount,
      inserted,
      getByIdOk: Boolean(byId),
      sortedNewestFirst,
      statuses: [...new Set(listed.map((lead) => lead.status))],
    },
    null,
    2,
  ),
);

if (listed.length < MIN_LEADS) {
  throw new Error(`Expected at least ${MIN_LEADS} leads, found ${listed.length}.`);
}
if (!byId) {
  throw new Error("LeadRepository.getById validation failed.");
}
if (!sortedNewestFirst) {
  throw new Error("LeadRepository.listByInstitutionId is not sorted newest-first.");
}
