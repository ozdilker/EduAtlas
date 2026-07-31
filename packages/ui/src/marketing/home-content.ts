export type HomeLinkItem = {
  id: string;
  label: string;
  href: string;
  countLabel?: string;
  imageUrl?: string;
};

export type HomeStatItem = {
  id: string;
  label: string;
  value: string;
};

export type HomeTrustItem = {
  id: string;
  label: string;
  description: string;
};

export type HomeStepItem = {
  id: string;
  step: string;
  title: string;
  description: string;
};

export type HomePopularSearch = {
  id: string;
  label: string;
  href: string;
};

export function getHomePopularTypes(): HomeLinkItem[] {
  return [
    {
      id: "anaokulu",
      label: "Anaokulu",
      href: "/categories/anaokulu",
      countLabel: "Keşfet",
      imageUrl: "/images/categories/anaokulu.png",
    },
    {
      id: "kres",
      label: "Kreş",
      href: "/categories/kres",
      countLabel: "Keşfet",
      imageUrl: "/images/categories/kres.png",
    },
    {
      id: "ozel-okul",
      label: "Özel Okul",
      href: "/categories/ozel-okul",
      countLabel: "Keşfet",
      imageUrl: "/images/categories/ozel-okul.png",
    },
    {
      id: "dershane",
      label: "Dershane",
      href: "/categories/dershane",
      countLabel: "Keşfet",
      imageUrl: "/images/categories/dershane.png",
    },
    {
      id: "etut-merkezi",
      label: "Etüt Merkezi",
      href: "/categories/etut-merkezi",
      countLabel: "Keşfet",
      imageUrl: "/images/categories/etut-merkezi.png",
    },
    {
      id: "dil-kursu",
      label: "Dil Kursu",
      href: "/categories/dil-kursu",
      countLabel: "Keşfet",
      imageUrl: "/images/categories/dil-kursu.png",
    },
  ];
}

export function getHomePopularCities(): HomeLinkItem[] {
  return [
    { id: "istanbul", label: "İstanbul", href: "/cities/istanbul", countLabel: "Kurumları gör" },
    { id: "ankara", label: "Ankara", href: "/cities/ankara", countLabel: "Kurumları gör" },
    { id: "izmir", label: "İzmir", href: "/cities/izmir", countLabel: "Kurumları gör" },
    { id: "bursa", label: "Bursa", href: "/cities/bursa", countLabel: "Kurumları gör" },
    { id: "antalya", label: "Antalya", href: "/cities/antalya", countLabel: "Kurumları gör" },
    { id: "gaziantep", label: "Gaziantep", href: "/cities/gaziantep", countLabel: "Kurumları gör" },
  ];
}

export function getHomePopularSearches(): HomePopularSearch[] {
  return [
    { id: "anaokulu", label: "Anaokulu", href: "/categories/anaokulu" },
    { id: "dershane", label: "Dershane", href: "/categories/dershane" },
    { id: "dil", label: "Dil kursu", href: "/categories/dil-kursu" },
    { id: "istanbul", label: "İstanbul", href: "/cities/istanbul" },
    { id: "ankara", label: "Ankara", href: "/cities/ankara" },
  ];
}

/**
 * Static presentation figures for the homepage UI (not live metrics).
 */
export function getHomeStatistics(): HomeStatItem[] {
  return [
    { id: "institutions", label: "Kurum profili", value: "500+" },
    { id: "cities", label: "Şehir hub’ı", value: "10+" },
    { id: "types", label: "Kurum türü", value: "6" },
    { id: "families", label: "Aileler için açık", value: "7/24" },
  ];
}

export function getHomeTrustBar(): HomeStatItem[] {
  return [
    { id: "institutions", label: "Eğitim Kurumu", value: "25.000+" },
    { id: "families", label: "Mutlu Öğrenci", value: "1.250.000+" },
    { id: "cities", label: "İlde Hizmet", value: "81" },
    { id: "rating", label: "Kullanıcı Puanı", value: "4,9 / 5" },
  ];
}

export function getHomeTrustIndicators(): HomeTrustItem[] {
  return [
    {
      id: "verified",
      label: "Güvenilir karar desteği",
      description:
        "Kurum bilgileri tutarlı alanlarla sunulur; eksik olanlar dürüstçe görünür, abartılmaz.",
    },
    {
      id: "local",
      label: "Yerel keşif",
      description: "Şehir ve ilçe yollarıyla ailenize yakın seçenekleri hızla daraltırsınız.",
    },
    {
      id: "contact",
      label: "Kolay iletişim",
      description: "İlgilendiğiniz kuruma tek formla bilgi talebi bırakırsınız.",
    },
    {
      id: "owners",
      label: "Kurumlar için görünürlük",
      description: "Okullar profillerini sahiplenip daha iyi ailelere ulaşabilir.",
    },
  ];
}

export function getHomeHowItWorks(): HomeStepItem[] {
  return [
    {
      id: "search",
      step: "01",
      title: "Arayın",
      description: "Kurum, şehir veya tür ile başlayın — arama ana kapınızdır.",
    },
    {
      id: "compare",
      step: "02",
      title: "Karşılaştırın",
      description: "Konum, tür, güven işaretleri ve programlarla net bir tablo çıkarın.",
    },
    {
      id: "contact",
      step: "03",
      title: "İletişime geçin",
      description: "Uygun kuruma bilgi talebi bırakın; kararınızı güvenle ilerletin.",
    },
  ];
}

export function getHomeImpactStats(): HomeStatItem[] {
  return [
    { id: "mission", label: "Aileler için keşif", value: "Rehberlik" },
    { id: "reach", label: "Kurumlar için erişim", value: "Büyüme" },
    { id: "quality", label: "Kaliteli profil vurgusu", value: "Güven" },
    { id: "support", label: "Destek yolu", value: "7/24" },
  ];
}
