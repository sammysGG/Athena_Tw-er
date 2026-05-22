import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

const UPLOAD_ROOT = join(process.cwd(), "uploads");
const ALLOWED_KINDS = new Set(["avatars", "posts"]);

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string; file: string }> }
) {
  const { kind, file } = await params;
  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Defense in depth: file should be a single basename, never traverse.
  if (file.includes("/") || file.includes("\\") || file.includes("..") || !file.match(/^[a-zA-Z0-9._-]+$/)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fullPath = join(UPLOAD_ROOT, kind, file);
  let info;
  try {
    info = await stat(fullPath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!info.isFile()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
  const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

  const nodeStream = createReadStream(fullPath);
  const webStream = Readable.toWeb(nodeStream) as unknown as NodeReadableStream<Uint8Array>;

  return new Response(webStream as unknown as BodyInit, {
    headers: {
      "content-type": contentType,
      "content-length": String(info.size),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
