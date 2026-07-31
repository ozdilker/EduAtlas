/**
 * Client-side YouTube / Vimeo URL parse for promo video preview.
 * Server-side validation lives in @eduatlas/domain (authoritative).
 */

export type PromoVideoPreview = {
  provider: "youtube" | "vimeo";
  embedUrl: string;
};

/**
 * Returns embed info when the value looks like a YouTube or Vimeo video URL.
 */
export function parsePromoVideoPreview(value: string | undefined): PromoVideoPreview | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  const youtubeId = parseYouTubeId(host, url);
  if (youtubeId) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  const vimeoId = parseVimeoId(host, url);
  if (vimeoId) {
    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  return null;
}

function parseYouTubeId(host: string, url: URL): string | null {
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
    return null;
  }
  return videoId;
}

function parseVimeoId(host: string, url: URL): string | null {
  const isVimeo = host === "vimeo.com" || host === "player.vimeo.com";
  if (!isVimeo) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "player.vimeo.com" && parts[0] === "video") {
    return /^\d{6,12}$/.test(parts[1] ?? "") ? (parts[1] ?? null) : null;
  }

  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (/^\d{6,12}$/.test(parts[i] ?? "")) {
      return parts[i] ?? null;
    }
  }
  return null;
}
