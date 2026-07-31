import type { FirestoreLeadDocument } from "@eduatlas/firebase/server";

export type OwnerDemoLeadSeed = {
  id: string;
  data: FirestoreLeadDocument;
};

/**
 * Deterministic sample leads for owner portal local/CI fallback.
 */
export function createOwnerDemoLeadDocuments(institutionId: string): OwnerDemoLeadSeed[] {
  const base = Date.parse("2026-07-01T08:00:00.000Z");

  const samples: Array<{
    id: string;
    parentName: string;
    phone: string;
    message: string;
    role: string;
    status: string;
    email?: string;
    preferredContactTime?: string;
    hoursAgo: number;
  }> = [
    {
      id: "lead_owner_demo_01",
      parentName: "Ayşe Yılmaz",
      phone: "+90 532 111 22 01",
      message: "2026-2027 eğitim yılı için kayıt şartlarını öğrenmek istiyorum.",
      role: "parent",
      status: "new",
      email: "ayse.yilmaz@example.com",
      preferredContactTime: "Hafta içi 10:00–12:00",
      hoursAgo: 2,
    },
    {
      id: "lead_owner_demo_02",
      parentName: "Mehmet Demir",
      phone: "+90 533 222 33 02",
      message: "Çocuğumuz için İngilizce programı hakkında bilgi alabilir miyiz?",
      role: "parent",
      status: "contacted",
      hoursAgo: 8,
    },
    {
      id: "lead_owner_demo_03",
      parentName: "Elif Kaya",
      phone: "+90 534 333 44 03",
      message: "Ücretlendirme ve burs imkanları hakkında görüşmek istiyorum.",
      role: "parent",
      status: "appointment",
      email: "elif.kaya@example.com",
      hoursAgo: 20,
    },
    {
      id: "lead_owner_demo_04",
      parentName: "Can Öztürk",
      phone: "+90 535 444 55 04",
      message: "Okul ziyareti için uygun bir gün ayarlayabilir misiniz?",
      role: "parent",
      status: "new",
      preferredContactTime: "Cumartesi öğleden sonra",
      hoursAgo: 28,
    },
    {
      id: "lead_owner_demo_05",
      parentName: "Zeynep Arslan",
      phone: "+90 536 555 66 05",
      message: "Lise hazırlık sınıfı kontenjanı var mı?",
      role: "parent",
      status: "enrolled",
      hoursAgo: 40,
    },
    {
      id: "lead_owner_demo_06",
      parentName: "Burak Şahin",
      phone: "+90 537 666 77 06",
      message: "Öğrenci olarak yaz okulu programlarınızı soruyorum.",
      role: "student",
      status: "lost",
      hoursAgo: 52,
    },
    {
      id: "lead_owner_demo_07",
      parentName: "Selin Aydın",
      phone: "+90 538 777 88 07",
      message: "Rehberlik ve psikolojik danışmanlık hizmetleri hakkında bilgi.",
      role: "parent",
      status: "appointment",
      email: "selin.aydin@example.com",
      hoursAgo: 65,
    },
    {
      id: "lead_owner_demo_08",
      parentName: "Emre Çelik",
      phone: "+90 539 888 99 08",
      message: "Ulaşım servisi güzergahları nelerdir?",
      role: "other",
      status: "contacted",
      hoursAgo: 78,
    },
    {
      id: "lead_owner_demo_09",
      parentName: "Deniz Koç",
      phone: "+90 541 999 00 09",
      message: "Özel eğitim destekleri sunuyor musunuz?",
      role: "parent",
      status: "enrolled",
      hoursAgo: 90,
    },
    {
      id: "lead_owner_demo_10",
      parentName: "Fatma Aksoy",
      phone: "+90 542 101 12 10",
      message: "Kardeş indirimi ve kayıt takvimi hakkında detay istiyorum.",
      role: "parent",
      status: "lost",
      preferredContactTime: "Akşam 18:00 sonrası",
      hoursAgo: 110,
    },
  ];

  return samples.map((sample) => {
    const createdAt = new Date(base + sample.hoursAgo * 3_600_000).toISOString();
    return {
      id: sample.id,
      data: {
        institutionId,
        parentName: sample.parentName,
        phone: sample.phone,
        message: sample.message,
        role: sample.role,
        status: sample.status,
        consentAcceptedAt: createdAt,
        consentPolicyVersion: "kvkk-lead-v1",
        ...(sample.email ? { email: sample.email } : {}),
        ...(sample.preferredContactTime
          ? { preferredContactTime: sample.preferredContactTime }
          : {}),
        createdAt,
        updatedAt: createdAt,
      },
    };
  });
}
