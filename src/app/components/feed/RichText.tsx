import Link from "next/link";
import { Fragment } from "react";
import { tokenize } from "@/lib/text";
import { parseMediaUrl } from "@/lib/media";
import { getTagTheme } from "@/lib/tag-themes";

type Props = {
  text: string;
  className?: string;
  /** When true, render mentions/hashtags as inverted-color links (on a
   * primary-colored bubble e.g. own DM message). */
  invert?: boolean;
};

export default function RichText({ text, className, invert }: Props) {
  const segments = tokenize(text);
  const baseLinkClass = invert
    ? "underline underline-offset-2 hover:opacity-90"
    : "text-primary hover:underline";
  return (
    <p className={className ?? "whitespace-pre-wrap break-words"}>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <Fragment key={i}>{seg.text}</Fragment>;
        if (seg.type === "mention")
          return (
            <Link key={i} href={`/u/${seg.username.toLowerCase()}`} className={baseLinkClass}>
              @{seg.username}
            </Link>
          );
        if (seg.type === "hashtag") {
          const theme = getTagTheme(seg.tag);
          // Themed hashtags override the default primary-blue with their
          // scenario color so they're recognisable inline. In inverted
          // bubbles (own DM) we stick with the inverted style.
          const className = invert
            ? baseLinkClass
            : theme
            ? `${theme.link} hover:underline font-medium`
            : baseLinkClass;
          return (
            <Link key={i} href={`/tag/${seg.tag.toLowerCase()}`} className={className}>
              #{seg.tag}
            </Link>
          );
        }

        // URL — if it's a recognisable media URL, collapse to a compact
        // "🔗 link" pill so it doesn't duplicate the embed below. The full
        // URL stays accessible as the native browser tooltip + the link's
        // href.
        const parsed = parseMediaUrl(seg.url);
        if (parsed && parsed.type !== "link") {
          const labelByType: Record<"image" | "video" | "youtube", string> = {
            image: "image",
            video: "video",
            youtube: "youtube",
          };
          return (
            <a
              key={i}
              href={seg.url}
              target="_blank"
              rel="noreferrer noopener"
              title={seg.url}
              className={`${baseLinkClass} inline-flex items-center gap-1 align-baseline text-xs font-medium px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/10 hover:bg-black/[0.08] dark:hover:bg-white/15 no-underline`}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              {labelByType[parsed.type]}
            </a>
          );
        }

        // Regular link — show full URL
        return (
          <a
            key={i}
            href={seg.url}
            target="_blank"
            rel="noreferrer noopener"
            className={`${baseLinkClass} break-all`}
          >
            {seg.url}
          </a>
        );
      })}
    </p>
  );
}
