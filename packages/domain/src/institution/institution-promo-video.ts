/**
 * Institution promotional video — YouTube or Vimeo URL only (no file upload).
 */

export type PromoVideoProvider = "youtube" | "vimeo";

export type ParsedPromoVideo = Readonly<{
  readonly provider: PromoVideoProvider;
  /** Canonical watch URL stored in Firestore. */
  readonly url: string;
  /** iframe-safe embed URL for previews. */
  readonly embedUrl: string;
  readonly videoId: string;
}>;

/**
 * Normalizes and validates a promo video URL. Empty → undefined (clear).
 */
export function createInstitutionPromoVideoUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return parsePromoVideo(trimmed).url;
}

/**
 * Parses a YouTube or Vimeo video URL into canonical + embed form.
 * @throws if not a supported video URL
 */
export function parsePromoVideo(value: string): ParsedPromoVideo {
  const trimmed = value.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Institution.promoVideoUrl must be a valid http(s) URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Institution.promoVideoUrl must be a valid http(s) URL.");
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  const youtube = parseYouTube(host, url);
  if (youtube) {
    return youtube;
  }

  const vimeo = parseVimeo(host, url);
  if (vimeo) {
    return vimeo;
  }

  throw new Error(
    "Institution.promoVideoUrl must be a YouTube or Vimeo video URL.",
  );
}

/**
 * Safe parse for UI preview — returns null when invalid / empty.
 */
export function tryParsePromoVideo(value: string | undefined): ParsedPromoVideo | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return parsePromoVideo(trimmed);
  } catch {
    return null;
  }
}

function parseYouTube(host: string, url: URL): ParsedPromoVideo | null {
  const isYouTube =
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtu.be";

  if (!isYouTube) {
    return null;
  }

  let videoId: string | undefined;

  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0];
  } else {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") {
      videoId = url.searchParams.get("v") ?? undefined;
    } else if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
      videoId = parts[1];
    } else if (parts[0] === "v") {
      videoId = parts[1];
    }
  }

  if (!videoId || !/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
    throw new Error("Institution.promoVideoUrl must be a YouTube video URL (not a channel).");
  }

  return Object.freeze({
    provider: "youtube",
    url: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    videoId,
  });
}

function parseVimeo(host: string, url: URL): ParsedPromoVideo | null {
  const isVimeo = host === "vimeo.com" || host === "player.vimeo.com";
  if (!isVimeo) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  let videoId: string | undefined;

  if (host === "player.vimeo.com" && parts[0] === "video") {
    videoId = parts[1];
  } else {
    // vimeo.com/{id} or vimeo.com/channels/.../{id} — take last numeric segment
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      if (/^\d{6,12}$/.test(parts[i] ?? "")) {
        videoId = parts[i];
        break;
      }
    }
  }

  if (!videoId) {
    throw new Error("Institution.promoVideoUrl must be a Vimeo video URL.");
  }

  return Object.freeze({
    provider: "vimeo",
    url: `https://vimeo.com/${videoId}`,
    embedUrl: `https://player.vimeo.com/video/${videoId}`,
    videoId,
  });
}
