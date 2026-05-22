import Link from "next/link";
import { Fragment } from "react";
import { tokenize } from "@/lib/text";
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
        // URL — open externally
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
