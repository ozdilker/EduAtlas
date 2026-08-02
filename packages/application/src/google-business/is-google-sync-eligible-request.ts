/**
 * Detects bots, crawlers, and Next.js / browser prefetch so lazy Google sync
 * only runs after a real user view.
 */
export function isGoogleSyncEligibleRequest(
  headers: Readonly<Record<string, string | null | undefined>> | Headers,
): boolean {
  const get = (name: string): string => {
    if (typeof (headers as Headers).get === "function") {
      return ((headers as Headers).get(name) ?? "").trim().toLowerCase();
    }
    const record = headers as Readonly<Record<string, string | null | undefined>>;
    const direct = record[name] ?? record[name.toLowerCase()];
    return (direct ?? "").trim().toLowerCase();
  };

  const purpose = get("purpose") || get("sec-purpose");
  if (purpose.includes("prefetch")) {
    return false;
  }

  if (get("next-router-prefetch") === "1" || get("x-middleware-prefetch") === "1") {
    return false;
  }

  if (get("sec-fetch-dest") === "empty" && get("sec-fetch-mode") === "cors") {
    // RSC flight / soft navigations still count as views; do not block here.
  }

  const ua = get("user-agent");
  if (!ua) {
    return false;
  }

  if (BOT_UA_PATTERN.test(ua)) {
    return false;
  }

  return true;
}

const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|discord|preview|lighthouse|pagespeed|pingdom|gtmetrix|headless|phantom|selenium|wget|curl|python-requests|scrapy|httpclient|java\/|go-http|libwww|ahrefs|semrush|mj12bot|dotbot|petalbot|yandex|baiduspider|duckduckbot|ia_archiver|archive\.org/i;
