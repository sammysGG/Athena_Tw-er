import Link from "next/link";
import { Fragment } from "react";
import { tokenize } from "@/lib/text";

type Props = {
  text: string;
  className?: string;
  /** When true, render mentions/hashtags as inverted-color links (on a
   * primary-colored bubble e.g. own DM message). */
  invert?: boolean;
};

export default function RichText({ text, className, invert }: Props) {
  const segments = tokenize(text);
  const linkClass = invert
    ? "underline underline-offset-2 hover:opacity-90"
    : "text-primary hover:underline";
  return (
    <p className={className ?? "whitespace-pre-wrap break-words"}>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <Fragment key={i}>{seg.text}</Fragment>;
        if (seg.type === "mention")
          return (
            <Link key={i} href={`/u/${seg.username.toLowerCase()}`} className={linkClass}>
              @{seg.username}
            </Link>
          );
        if (seg.type === "hashtag")
          return (
            <Link key={i} href={`/tag/${seg.tag.toLowerCase()}`} className={linkClass}>
              #{seg.tag}
            </Link>
          );
        // URL — open externally
        return (
          <a
            key={i}
            href={seg.url}
            target="_blank"
            rel="noreferrer noopener"
            className={`${linkClass} break-all`}
          >
            {seg.url}
          </a>
        );
      })}
    </p>
  );
}
