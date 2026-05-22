// Parsers shared between server and client.

const MENTION_RE = /(^|[^a-zA-Z0-9_])@([a-zA-Z0-9_]{2,30})/g;
const HASHTAG_RE = /(^|[^a-zA-Z0-9_])#([a-zA-Z0-9_]{1,40})/g;

export function extractMentions(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(MENTION_RE)) {
    out.add(m[2].toLowerCase());
  }
  return Array.from(out);
}

export function extractHashtags(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(HASHTAG_RE)) {
    out.add(m[2].toLowerCase());
  }
  return Array.from(out);
}

export type RichSegment =
  | { type: "text"; text: string }
  | { type: "mention"; username: string }
  | { type: "hashtag"; tag: string }
  | { type: "url"; url: string };

const URL_RE = /(https?:\/\/[^\s<>()]+[^\s.,;:!?<>()'"])/g;
// Combined: order matters in alternation; URLs first so they don't get eaten
// by the mention pattern when they contain "@".
const TOKEN_RE = new RegExp(
  `(https?:\\/\\/[^\\s<>()]+[^\\s.,;:!?<>()'"])` +
    `|(^|[^a-zA-Z0-9_])@([a-zA-Z0-9_]{2,30})` +
    `|(^|[^a-zA-Z0-9_])#([a-zA-Z0-9_]{1,40})`,
  "g"
);

export function tokenize(text: string): RichSegment[] {
  if (!text) return [];
  const out: RichSegment[] = [];
  let lastIndex = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const start = m.index ?? 0;
    if (m[1]) {
      // URL match — m[1] starts at `start`
      if (start > lastIndex) {
        out.push({ type: "text", text: text.slice(lastIndex, start) });
      }
      out.push({ type: "url", url: m[1] });
      lastIndex = start + m[1].length;
    } else if (m[3]) {
      // Mention — m[2] is the lookbehind char (or empty at start),
      // m[3] is the username. lookbehind char belongs to the preceding text.
      const lead = m[2] ?? "";
      const matchStart = start + lead.length;
      if (matchStart > lastIndex) {
        out.push({ type: "text", text: text.slice(lastIndex, matchStart) });
      }
      out.push({ type: "mention", username: m[3] });
      lastIndex = matchStart + 1 + m[3].length;
    } else if (m[5]) {
      const lead = m[4] ?? "";
      const matchStart = start + lead.length;
      if (matchStart > lastIndex) {
        out.push({ type: "text", text: text.slice(lastIndex, matchStart) });
      }
      out.push({ type: "hashtag", tag: m[5] });
      lastIndex = matchStart + 1 + m[5].length;
    }
  }
  if (lastIndex < text.length) {
    out.push({ type: "text", text: text.slice(lastIndex) });
  }
  return out;
}

export { URL_RE };
