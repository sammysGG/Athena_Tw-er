import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { requireUser, errorResponse } from "@/lib/auth-helpers";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
]);
const ALLOWED_KINDS = new Set(["avatar", "post"]);

const UPLOAD_ROOT = join(process.cwd(), "public", "uploads");

export async function POST(req: Request) {
  try {
    await requireUser();

    const form = await req.formData();
    const file = form.get("file");
    const kindRaw = String(form.get("kind") ?? "post");
    const kind = ALLOWED_KINDS.has(kindRaw) ? kindRaw : "post";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 415 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` },
        { status: 413 }
      );
    }
    if (kind === "avatar" && !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Avatars must be images" },
        { status: 400 }
      );
    }

    const ext = sanitizeExt(file.name, file.type);
    const filename = `${randomBytes(12).toString("hex")}${ext}`;
    const subdir = kind === "avatar" ? "avatars" : "posts";
    const targetDir = join(UPLOAD_ROOT, subdir);
    await mkdir(targetDir, { recursive: true });

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(join(targetDir, filename), bytes);

    const url = `/uploads/${subdir}/${filename}`;
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    return NextResponse.json({ url, type: mediaType });
  } catch (err) {
    return errorResponse(err);
  }
}

function sanitizeExt(name: string, mime: string): string {
  const fromName = extname(name).toLowerCase();
  const safe = /^\.[a-z0-9]{1,5}$/.test(fromName);
  if (safe) return fromName;
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    case "video/mp4":
      return ".mp4";
    case "video/webm":
      return ".webm";
    default:
      return ".bin";
  }
}
