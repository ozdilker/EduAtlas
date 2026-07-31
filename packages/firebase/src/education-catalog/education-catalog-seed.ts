import {
  createEducationCatalogItem,
  type EducationCatalogItem,
  EducationCatalogKind,
  EducationCatalogStatus,
} from "@eduatlas/domain";

const NOW = Object.freeze({
  createdAt: "2026-07-15T14:00:00.000Z",
  updatedAt: "2026-07-15T14:00:00.000Z",
});

type SeedRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  parentId?: string;
  order: number;
};

function items(
  kind: EducationCatalogKind,
  rows: readonly SeedRow[],
): readonly EducationCatalogItem[] {
  return Object.freeze(
    rows.map((row) =>
      createEducationCatalogItem({
        kind,
        status: EducationCatalogStatus.Published,
        ...row,
        ...NOW,
      }),
    ),
  );
}

const INSTITUTION_TYPES: readonly SeedRow[] = [
  {
    id: "private_school",
    slug: "ozel-okul",
    name: "Özel Okul",
    description: "Resmi müfredata bağlı, ücretli özel ilkokul, ortaokul ve lise kurumları.",
    order: 10,
  },
  {
    id: "dershane",
    slug: "dershane",
    name: "Dershane",
    description: "YKS, LGS ve benzeri merkezi sınavlara hazırlık odaklı özel öğretim kurumları.",
    order: 20,
  },
  {
    id: "etut_merkezi",
    slug: "etut-merkezi",
    name: "Etüt Merkezi",
    description: "Ders takviyesi, ödev desteği ve küçük grup çalışma programları sunan kurumlar.",
    order: 30,
  },
  {
    id: "language_school",
    slug: "dil-okulu",
    name: "Dil Okulu",
    description:
      "Yabancı dil eğitimi, seviye sınavları ve uluslararası dil sertifikasına hazırlık veren kurumlar.",
    order: 40,
  },
  {
    id: "kindergarten",
    slug: "anaokulu",
    name: "Anaokulu",
    description: "Okul öncesi eğitimde oyun temelli öğrenme ve sosyal gelişim odaklı kurumlar.",
    order: 50,
  },
  {
    id: "preschool",
    slug: "kres",
    name: "Kreş",
    description: "Erken çocukluk bakımı ve gelişim destekli kreş / gündüz bakımevi hizmetleri.",
    order: 60,
  },
];

const PROGRAMS: readonly SeedRow[] = [
  {
    id: "program-okul-oncesi",
    slug: "okul-oncesi",
    name: "Okul Öncesi Programı",
    description: "3–6 yaş çocuklar için gelişim temelli tam gün veya yarım gün programlar.",
    order: 10,
  },
  {
    id: "program-ilkogretim",
    slug: "ilkogretim",
    name: "İlköğretim Destek Programı",
    description: "İlkokul ve ortaokul müfredatına uyumlu takviye ve etüt programları.",
    order: 20,
  },
  {
    id: "program-lgs-hazirlik",
    slug: "lgs-hazirlik",
    name: "LGS Hazırlık",
    description: "Liselere Geçiş Sistemi için disiplin bazlı sınav hazırlık programı.",
    order: 30,
  },
  {
    id: "program-yks-hazirlik",
    slug: "yks-hazirlik",
    name: "YKS Hazırlık",
    description: "TYT ve AYT odaklı üniversiteye hazırlık programları.",
    order: 40,
  },
  {
    id: "program-yks-sayisal",
    slug: "yks-sayisal",
    name: "YKS Sayısal",
    description: "Matematik, Fizik, Kimya ve Biyoloji ağırlıklı sayısal alan programı.",
    parentId: "program-yks-hazirlik",
    order: 41,
  },
  {
    id: "program-yks-sozel",
    slug: "yks-sozel",
    name: "YKS Sözel",
    description: "Edebiyat, tarih, coğrafya ve felsefe grubu sözel alan programı.",
    parentId: "program-yks-hazirlik",
    order: 42,
  },
  {
    id: "program-yks-ea",
    slug: "yks-esit-agirlik",
    name: "YKS Eşit Ağırlık",
    description: "Matematik ve sosyal bilimler dengeli eşit ağırlık programı.",
    parentId: "program-yks-hazirlik",
    order: 43,
  },
  {
    id: "program-dil",
    slug: "dil-egitimi",
    name: "Dil Eğitimi Programı",
    description: "Genel ve akademik amaçlı yabancı dil öğrenme yolları.",
    order: 50,
  },
  {
    id: "program-yb-sinav",
    slug: "yabanci-dil-sinav-hazirlik",
    name: "Yabancı Dil Sınav Hazırlık",
    description: "IELTS, TOEFL, Cambridge ve YDS/YÖKDİL hazırlık programları.",
    parentId: "program-dil",
    order: 51,
  },
  {
    id: "program-yaz-okulu",
    slug: "yaz-okulu",
    name: "Yaz Okulu",
    description: "Tatil döneminde akademik ve sosyal etkinlikleri birleştiren yaz programları.",
    order: 60,
  },
];

const EDUCATIONAL_APPROACHES: readonly SeedRow[] = [
  {
    id: "approach-montessori",
    slug: "montessori",
    name: "Montessori",
    description:
      "Öğrenci temposuna saygılı, somut materyallerle öz yönlendirmeli öğrenme yaklaşımı.",
    order: 10,
  },
  {
    id: "approach-reggio",
    slug: "reggio-emilia",
    name: "Reggio Emilia",
    description: "Proje temelli, sanat ve belgeleme odaklı erken çocukluk yaklaşımı.",
    order: 20,
  },
  {
    id: "approach-ib",
    slug: "ib",
    name: "IB (International Baccalaureate)",
    description: "Uluslararası bakalorya çerçevesinde sorgulayıcı ve disiplinlerarası eğitim.",
    order: 30,
  },
  {
    id: "approach-stem",
    slug: "stem",
    name: "STEM",
    description: "Fen, teknoloji, mühendislik ve matematik bütünleşik öğrenme yaklaşımı.",
    order: 40,
  },
  {
    id: "approach-steam",
    slug: "steam",
    name: "STEAM",
    description: "STEM’e sanat bileşeninin eklendiği yaratıcı problem çözme yaklaşımı.",
    parentId: "approach-stem",
    order: 41,
  },
  {
    id: "approach-waldorf",
    slug: "waldorf",
    name: "Waldorf",
    description: "Ritim, sanat ve hayal gücünü merkeze alan bütüncül eğitim yaklaşımı.",
    order: 50,
  },
  {
    id: "approach-meb",
    slug: "meb-mufredat",
    name: "MEB Müfredatı",
    description: "Milli Eğitim Bakanlığı resmi öğretim programına dayalı standart yaklaşım.",
    order: 60,
  },
  {
    id: "approach-oyun",
    slug: "oyun-temelli",
    name: "Oyun Temelli Öğrenme",
    description: "Erken yaşlarda oyunla keşif, dil ve sosyal becerilerin desteklendiği yaklaşım.",
    order: 70,
  },
];

const LANGUAGES: readonly SeedRow[] = [
  {
    id: "lang-tr",
    slug: "turkce",
    name: "Türkçe",
    description: "Ana dil ve eğitim dili olarak Türkçe.",
    order: 10,
  },
  {
    id: "lang-en",
    slug: "ingilizce",
    name: "İngilizce",
    description: "Genel, akademik ve sınav odaklı İngilizce eğitimi.",
    order: 20,
  },
  {
    id: "lang-de",
    slug: "almanca",
    name: "Almanca",
    description: "Günlük iletişim ve Goethe sınavlarına hazırlık Almanca programları.",
    order: 30,
  },
  {
    id: "lang-fr",
    slug: "fransizca",
    name: "Fransızca",
    description: "İletişimsel Fransızca ve DELF/DALF odaklı eğitim.",
    order: 40,
  },
  {
    id: "lang-ar",
    slug: "arapca",
    name: "Arapça",
    description: "Modern standart Arapça ve konuşma odaklı programlar.",
    order: 50,
  },
  {
    id: "lang-es",
    slug: "ispanyolca",
    name: "İspanyolca",
    description: "Başlangıçtan ileri seviyeye İspanyolca dil eğitimi.",
    order: 60,
  },
  {
    id: "lang-ru",
    slug: "rusca",
    name: "Rusça",
    description: "İş ve akademik amaçlı Rusça öğrenme yolları.",
    order: 70,
  },
];

const AGE_GROUPS: readonly SeedRow[] = [
  {
    id: "age-0-3",
    slug: "0-3-yas",
    name: "0–3 Yaş",
    description: "Bebek ve toddler dönemine uygun kreş / erken bakım yaş grubu.",
    order: 10,
  },
  {
    id: "age-3-6",
    slug: "3-6-yas",
    name: "3–6 Yaş",
    description: "Okul öncesi anaokulu ve oyun temelli eğitim yaş grubu.",
    order: 20,
  },
  {
    id: "age-6-10",
    slug: "6-10-yas",
    name: "6–10 Yaş",
    description: "İlkokul dönemi akademik ve sosyal gelişim yaş grubu.",
    order: 30,
  },
  {
    id: "age-10-14",
    slug: "10-14-yas",
    name: "10–14 Yaş",
    description: "Ortaokul ve LGS hazırlık odaklı yaş grubu.",
    order: 40,
  },
  {
    id: "age-14-18",
    slug: "14-18-yas",
    name: "14–18 Yaş",
    description: "Lise ve YKS hazırlık dönemini kapsayan yaş grubu.",
    order: 50,
  },
  {
    id: "age-18-plus",
    slug: "18-plus",
    name: "18+ Yetişkin",
    description: "Yetişkin dil, kariyer ve kişisel gelişim programları yaş grubu.",
    order: 60,
  },
];

const EXAM_TYPES: readonly SeedRow[] = [
  {
    id: "exam-lgs",
    slug: "lgs",
    name: "LGS",
    description: "Liselere Geçiş Sistemi merkezi sınavı.",
    order: 10,
  },
  {
    id: "exam-yks",
    slug: "yks",
    name: "YKS",
    description: "Yükseköğretim Kurumları Sınavı (TYT + AYT).",
    order: 20,
  },
  {
    id: "exam-tyt",
    slug: "tyt",
    name: "TYT",
    description: "Temel Yeterlilik Testi — YKS birinci oturum.",
    parentId: "exam-yks",
    order: 21,
  },
  {
    id: "exam-ayt",
    slug: "ayt",
    name: "AYT",
    description: "Alan Yeterlilik Testleri — YKS ikinci oturum.",
    parentId: "exam-yks",
    order: 22,
  },
  {
    id: "exam-ydt",
    slug: "ydt",
    name: "YDT",
    description: "Yabancı Dil Testi — YKS dil oturumu.",
    parentId: "exam-yks",
    order: 23,
  },
  {
    id: "exam-ielts",
    slug: "ielts",
    name: "IELTS",
    description: "Uluslararası İngilizce dil yeterlilik sınavı.",
    order: 30,
  },
  {
    id: "exam-toefl",
    slug: "toefl",
    name: "TOEFL",
    description: "Akademik İngilizce yeterlilik sınavı (iBT).",
    order: 40,
  },
  {
    id: "exam-yds",
    slug: "yds",
    name: "YDS",
    description: "Yabancı Dil Bilgisi Seviye Tespit Sınavı.",
    order: 50,
  },
  {
    id: "exam-yokdil",
    slug: "yokdil",
    name: "YÖKDİL",
    description: "Yükseköğretim Kurumları Yabancı Dil Sınavı.",
    order: 60,
  },
];

const COURSE_CATEGORIES: readonly SeedRow[] = [
  {
    id: "cat-matematik",
    slug: "matematik",
    name: "Matematik",
    description: "Temel matematik, geometri ve sayısal mantık kursları.",
    order: 10,
  },
  {
    id: "cat-fen",
    slug: "fen-bilimleri",
    name: "Fen Bilimleri",
    description: "Fizik, kimya, biyoloji ve genel fen takviye kursları.",
    order: 20,
  },
  {
    id: "cat-turkce",
    slug: "turkce-edebiyat",
    name: "Türkçe / Edebiyat",
    description: "Okuma-anlama, yazım ve edebiyat dersleri.",
    order: 30,
  },
  {
    id: "cat-sosyal",
    slug: "sosyal-bilimler",
    name: "Sosyal Bilimler",
    description: "Tarih, coğrafya, felsefe ve din kültürü grubu.",
    order: 40,
  },
  {
    id: "cat-dil",
    slug: "yabanci-dil",
    name: "Yabancı Dil",
    description: "Konuşma, dilbilgisi ve sınav odaklı dil kursları.",
    order: 50,
  },
  {
    id: "cat-kodlama",
    slug: "kodlama-robotik",
    name: "Kodlama / Robotik",
    description: "Programlama, robotik ve dijital üretim atölyeleri.",
    order: 60,
  },
  {
    id: "cat-sanat",
    slug: "sanat-muzik",
    name: "Sanat / Müzik",
    description: "Görsel sanatlar, müzik ve yaratıcı ifade atölyeleri.",
    order: 70,
  },
  {
    id: "cat-spor",
    slug: "spor",
    name: "Spor",
    description: "Fiziksel gelişim ve branş spor kursları.",
    order: 80,
  },
  {
    id: "cat-rehberlik",
    slug: "rehberlik-kocluk",
    name: "Rehberlik / Koçluk",
    description: "Öğrenci koçluğu, motivasyon ve sınav kaygısı desteği.",
    order: 90,
  },
];

export type EducationCatalogSeedBundle = Readonly<{
  readonly itemsByKind: Readonly<Record<EducationCatalogKind, readonly EducationCatalogItem[]>>;
  readonly allItems: readonly EducationCatalogItem[];
}>;

/**
 * High-quality Turkish education taxonomy seed (reference catalogs only).
 */
export function buildEducationCatalogSeedBundle(): EducationCatalogSeedBundle {
  const itemsByKind = Object.freeze({
    [EducationCatalogKind.InstitutionTypes]: items(
      EducationCatalogKind.InstitutionTypes,
      INSTITUTION_TYPES,
    ),
    [EducationCatalogKind.Programs]: items(EducationCatalogKind.Programs, PROGRAMS),
    [EducationCatalogKind.EducationalApproaches]: items(
      EducationCatalogKind.EducationalApproaches,
      EDUCATIONAL_APPROACHES,
    ),
    [EducationCatalogKind.Languages]: items(EducationCatalogKind.Languages, LANGUAGES),
    [EducationCatalogKind.AgeGroups]: items(EducationCatalogKind.AgeGroups, AGE_GROUPS),
    [EducationCatalogKind.ExamTypes]: items(EducationCatalogKind.ExamTypes, EXAM_TYPES),
    [EducationCatalogKind.CourseCategories]: items(
      EducationCatalogKind.CourseCategories,
      COURSE_CATEGORIES,
    ),
  });

  const allItems = Object.freeze(Object.values(itemsByKind).flat());

  return Object.freeze({ itemsByKind, allItems });
}
