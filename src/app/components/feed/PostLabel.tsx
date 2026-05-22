type Props = { label?: string | null };

const LABELS: Record<
  string,
  { text: string; tone: string; icon: string }
> = {
  disputed: {
    text: "Disputed",
    tone: "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: "⚠️",
  },
  "state-media": {
    text: "State media",
    tone: "border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-300",
    icon: "📡",
  },
  "ai-generated": {
    text: "AI-generated",
    tone: "border-purple-500/60 bg-purple-500/10 text-purple-700 dark:text-purple-300",
    icon: "⚠️",
  },
  official: {
    text: "Official statement",
    tone: "border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    icon: "🏛️",
  },
  satire: {
    text: "Satire",
    tone: "border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    icon: "🎭",
  },
};

export default function PostLabel({ label }: Props) {
  if (!label) return null;
  const meta = LABELS[label];
  if (!meta) return null;
  return (
    <div
      className={`flex items-center gap-2 border rounded-md px-2 py-1 text-xs font-semibold mb-2 ${meta.tone}`}
    >
      <span>{meta.icon}</span>
      <span className="uppercase tracking-wider">{meta.text}</span>
    </div>
  );
}

export const POST_LABEL_OPTIONS = Object.entries(LABELS).map(
  ([value, meta]) => ({ value, label: `${meta.icon} ${meta.text}` })
);
