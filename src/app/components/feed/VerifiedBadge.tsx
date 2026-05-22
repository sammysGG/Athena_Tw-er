type Props = { type?: string | null; size?: "sm" | "md" };

const STYLES: Record<
  string,
  { icon: string; label: string; tone: string }
> = {
  press: {
    icon: "🛡️",
    label: "Verified press",
    tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  gov: {
    icon: "🏛️",
    label: "Government",
    tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  mil: {
    icon: "⚔️",
    label: "Military",
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  state: {
    icon: "📡",
    label: "State-affiliated",
    tone: "bg-red-500/15 text-red-700 dark:text-red-300",
  },
  bot: {
    icon: "🤖",
    label: "Automated",
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  ai: {
    icon: "⚠️",
    label: "AI-generated",
    tone: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  },
};

export default function VerifiedBadge({ type, size = "sm" }: Props) {
  if (!type) return null;
  const meta = STYLES[type];
  if (!meta) return null;
  const cls =
    size === "md"
      ? "text-xs px-2 py-0.5 rounded"
      : "text-[10px] px-1.5 py-0.5 rounded";
  return (
    <span
      className={`${cls} ${meta.tone} font-medium inline-flex items-center gap-1 whitespace-nowrap`}
      title={meta.label}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}

export const VERIFIED_OPTIONS = Object.entries(STYLES).map(
  ([value, meta]) => ({ value, label: `${meta.icon} ${meta.label}` })
);
