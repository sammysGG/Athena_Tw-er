import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth-helpers";

// Keyless meme source backed by Imgflip's public get_memes endpoint. No API key,
// but needs outbound egress to api.imgflip.com. Returns ~100 popular meme
// *templates* (static images, not animated GIFs).
//
// Imgflip has no search API, so we cache the template list and filter it by name
// server-side, which keeps the picker's search box meaningful. Response shape
// matches what GifPicker expects: { gifs: [{ id, url, preview, description }] }.

const IMGFLIP_URL = "https://api.imgflip.com/get_memes";
const CACHE_TTL_MS = 60 * 60 * 1000; // templates barely change; refresh hourly

type ImgflipMeme = { id: string; name: string; url: string };

let cache: { memes: ImgflipMeme[]; at: number } | null = null;

async function loadMemes(): Promise<ImgflipMeme[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.memes;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let res: Response;
  try {
    res = await fetch(IMGFLIP_URL, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new Error(`Imgflip returned ${res.status}`);

  const data = (await res.json()) as {
    success?: boolean;
    data?: { memes?: ImgflipMeme[] };
  };
  if (!data.success || !data.data?.memes) throw new Error("Imgflip response malformed");

  cache = { memes: data.data.memes, at: Date.now() };
  return cache.memes;
}

export async function GET(req: Request) {
  try {
    await requireUser();

    const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase() ?? "";

    let memes: ImgflipMeme[];
    try {
      memes = await loadMemes();
    } catch {
      return NextResponse.json({ error: "Could not reach Imgflip." }, { status: 502 });
    }

    const filtered = q ? memes.filter((m) => m.name.toLowerCase().includes(q)) : memes;
    const gifs = filtered.map((m) => ({
      id: m.id,
      url: m.url,
      preview: m.url,
      description: m.name,
    }));

    return NextResponse.json({ gifs });
  } catch (err) {
    return errorResponse(err);
  }
}
