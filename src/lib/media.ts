export type MediaType = "image" | "video" | "youtube" | "link";

export type ParsedMedia = {
  type: MediaType;
  url: string;
  embedUrl?: string;
};

const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".m4v"];

export function parseMediaUrl(raw: string): ParsedMedia | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  // Local uploads — trust the type implied by extension
  if (YT_HOSTS.has(url.hostname)) {
    const id =
      url.hostname === "youtu.be"
        ? url.pathname.slice(1)
        : url.searchParams.get("v");
    if (id && /^[A-Za-z0-9_-]{6,15}$/.test(id)) {
      return {
        type: "youtube",
        url: raw,
        embedUrl: `https://www.youtube.com/embed/${id}`,
      };
    }
  }

  const pathLower = url.pathname.toLowerCase();
  if (IMAGE_EXTS.some((ext) => pathLower.endsWith(ext))) {
    return { type: "image", url: raw };
  }
  if (VIDEO_EXTS.some((ext) => pathLower.endsWith(ext))) {
    return { type: "video", url: raw };
  }
  return { type: "link", url: raw };
}
