export type NavItem = {
  id: string;
  label: string;
  href: string;
};

/**
 * Primary public navigation — points at live public routes.
 */
export function getPrimaryNavItems(): NavItem[] {
  return [
    { id: "categories", label: "Kategoriler", href: "/categories" },
    { id: "cities", label: "Şehirler", href: "/cities" },
    { id: "about", label: "Hakkımızda", href: "/about" },
    { id: "contact", label: "İletişim", href: "/contact" },
  ];
}

/**
 * Priority city shortcuts for header/footer discovery.
 */
export function getPriorityCityLinks(): NavItem[] {
  return [
    { id: "istanbul", label: "İstanbul", href: "/cities/istanbul" },
    { id: "ankara", label: "Ankara", href: "/cities/ankara" },
    { id: "izmir", label: "İzmir", href: "/cities/izmir" },
    { id: "bursa", label: "Bursa", href: "/cities/bursa" },
    { id: "antalya", label: "Antalya", href: "/cities/antalya" },
    { id: "gaziantep", label: "Gaziantep", href: "/cities/gaziantep" },
  ];
}

/**
 * Priority category shortcuts for header/footer discovery.
 */
export function getPriorityCategoryLinks(): NavItem[] {
  return [
    { id: "anaokulu", label: "Anaokulu", href: "/categories/anaokulu" },
    { id: "kres", label: "Kreş", href: "/categories/kres" },
    { id: "ozel-okul", label: "Özel Okul", href: "/categories/ozel-okul" },
    { id: "dershane", label: "Dershane", href: "/categories/dershane" },
    { id: "etut-merkezi", label: "Etüt Merkezi", href: "/categories/etut-merkezi" },
    { id: "dil-kursu", label: "Dil Kursu", href: "/categories/dil-kursu" },
  ];
}

export type FooterLink = {
  id: string;
  label: string;
  href: string;
};

export type FooterSection = {
  id: string;
  title: string;
  links: FooterLink[];
};

/**
 * Footer link graph grouped by section.
 */
export function getFooterSections(): FooterSection[] {
  return [
    {
      id: "explore",
      title: "Keşfet",
      links: [
        { id: "search", label: "Arama", href: "/search" },
        { id: "institutions", label: "Kurumlar", href: "/institutions" },
        { id: "categories", label: "Kurum Tipleri", href: "/categories" },
        { id: "cities", label: "Şehirler", href: "/cities" },
      ],
    },
    {
      id: "cities",
      title: "Şehirler",
      links: [
        { id: "cities-index", label: "Tüm şehirler", href: "/cities" },
        ...getPriorityCityLinks().map((item) => ({
          id: item.id,
          label: item.label,
          href: item.href,
        })),
      ],
    },
    {
      id: "categories",
      title: "Kurum tipleri",
      links: [
        { id: "categories-index", label: "Tüm tipler", href: "/categories" },
        ...getPriorityCategoryLinks()
          .slice(0, 5)
          .map((item) => ({
            id: item.id,
            label: item.label,
            href: item.href,
          })),
      ],
    },
    {
      id: "company",
      title: "Şirket",
      links: [
        { id: "about", label: "Hakkımızda", href: "/about" },
        { id: "contact", label: "İletişim", href: "/contact" },
        { id: "claim", label: "Kurumunu Sahiplen", href: "/register" },
        { id: "login", label: "Kurum Girişi", href: "/login" },
      ],
    },
    {
      id: "legal",
      title: "Yasal",
      links: [
        { id: "privacy", label: "Gizlilik", href: "/privacy" },
        { id: "terms", label: "Kullanım Koşulları", href: "/terms" },
      ],
    },
  ];
}

export type SocialLink = {
  id: string;
  label: string;
  href: string;
};

/**
 * Social placeholders — labels only until channels are configured.
 */
export function getSocialPlaceholders(): SocialLink[] {
  return [
    { id: "instagram", label: "Instagram", href: "" },
    { id: "x", label: "X", href: "" },
    { id: "linkedin", label: "LinkedIn", href: "" },
  ];
}

/**
 * Whether a nav href should show as the current page.
 */
export function isNavItemActive(href: string, currentPath?: string): boolean {
  if (!currentPath) {
    return false;
  }

  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}
