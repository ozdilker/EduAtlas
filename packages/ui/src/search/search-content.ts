export type SearchSuggestionItem = {
  id: string;
  label: string;
  description?: string;
};

export type SearchFilterPlaceholder = {
  id: string;
  label: string;
  placeholder: string;
};

export type SearchStatus = "idle" | "loading" | "empty" | "error";

export function getStaticSearchSuggestions(): SearchSuggestionItem[] {
  return [
    {
      id: "anaokulu-istanbul",
      label: "Anaokulu · İstanbul",
      description: "Örnek öneri",
    },
    {
      id: "dershane-ankara",
      label: "Dershane · Ankara",
      description: "Örnek öneri",
    },
    {
      id: "dil-kursu-izmir",
      label: "Dil kursu · İzmir",
      description: "Örnek öneri",
    },
    {
      id: "ozel-okul-bursa",
      label: "Özel okul · Bursa",
      description: "Örnek öneri",
    },
  ];
}

export function getSearchFilterPlaceholders(): SearchFilterPlaceholder[] {
  return [
    { id: "city", label: "Şehir", placeholder: "Şehir seçin" },
    { id: "district", label: "İlçe", placeholder: "İlçe seçin" },
    { id: "type", label: "Kurum türü", placeholder: "Tür seçin" },
  ];
}

export function getSearchStatusMessage(status: SearchStatus): string | null {
  switch (status) {
    case "loading":
      return "Arama sonuçları yükleniyor…";
    case "empty":
      return "Sonuç bulunamadı. Filtreleri genişletin veya başka bir şehir deneyin.";
    case "error":
      return "Arama şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
    default:
      return null;
  }
}
