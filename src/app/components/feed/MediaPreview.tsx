type Props = {
  url: string;
  type: string;
};

export default function MediaPreview({ url, type }: Props) {
  if (type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer noopener" className="block mt-3">
        <img
          src={url}
          alt=""
          className="rounded-lg max-h-96 w-auto border border-gray-200 dark:border-white/10"
        />
      </a>
    );
  }
  if (type === "video") {
    return (
      <video
        src={url}
        controls
        playsInline
        className="rounded-lg max-h-96 w-full mt-3 border border-gray-200 dark:border-white/10"
      />
    );
  }
  if (type === "youtube") {
    const id = extractYouTubeId(url);
    if (!id) {
      return (
        <a href={url} target="_blank" rel="noreferrer noopener" className="block mt-3 text-primary hover:underline break-all">
          {url}
        </a>
      );
    }
    return (
      <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title="YouTube video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="block mt-3 text-primary hover:underline break-all text-sm"
    >
      {url}
    </a>
  );
}

function extractYouTubeId(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}
