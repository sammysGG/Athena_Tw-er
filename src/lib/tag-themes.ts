// Visual treatment for specific scenario hashtags. Used both in inline link
// rendering (RichText) and on the /tag/[name] page header.

export type TagTheme = {
  /** Inline link color in a post / comment / chat message. */
  link: string;
  /** Tag-page header card border. */
  border: string;
  /** Tag-page header card background. */
  bg: string;
  /** Tag-page subtitle / accent text. */
  subtitle?: string;
  /** Tag-page tagline override. */
  tagline?: string;
  /** Leading icon shown on the tag page header. */
  flag?: string;
};

export const TAG_THEMES: Record<string, TagTheme> = {
  nato: {
    link: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
    border: "border-blue-500/50",
    bg: "bg-blue-500/5",
    subtitle: "text-blue-700 dark:text-blue-300",
    tagline: "Alliance posture, exercises, and analyst commentary.",
    flag: "🛡️",
  },
  donovia: {
    link: "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300",
    border: "border-red-500/50",
    bg: "bg-red-500/5",
    subtitle: "text-red-700 dark:text-red-300",
    tagline: "Donovian statements and state-aligned chatter.",
    flag: "🇩🇴",
  },
  estonia: {
    link: "text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300",
    border: "border-sky-500/40",
    bg: "bg-sky-500/5",
    subtitle: "text-sky-700 dark:text-sky-300",
    flag: "🇪🇪",
  },
  cyber: {
    link: "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/5",
    subtitle: "text-emerald-700 dark:text-emerald-300",
    tagline: "Incidents, IOCs, and defender talk.",
    flag: "🛰️",
  },
  greyzone: {
    link: "text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200",
    border: "border-slate-400/50",
    bg: "bg-slate-500/5",
    subtitle: "text-slate-700 dark:text-slate-300",
    tagline: "Sub-threshold operations and hybrid threat chatter.",
    flag: "🌫️",
  },
  british: {
    link: "text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300",
    border: "border-indigo-500/40",
    bg: "bg-indigo-500/5",
    subtitle: "text-indigo-700 dark:text-indigo-300",
    flag: "🇬🇧",
  },
  us: {
    link: "text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300",
    border: "border-violet-500/40",
    bg: "bg-violet-500/5",
    subtitle: "text-violet-700 dark:text-violet-300",
    flag: "🇺🇸",
  },
  ariana: {
    link: "text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-700 dark:hover:text-fuchsia-300",
    border: "border-fuchsia-500/40",
    bg: "bg-fuchsia-500/5",
    subtitle: "text-fuchsia-700 dark:text-fuchsia-300",
    tagline: "Tracking the joint Estonia/NATO 'Ariana' exercise call-sign.",
    flag: "📡",
  },
};

export function getTagTheme(tag: string): TagTheme | undefined {
  return TAG_THEMES[tag.toLowerCase()];
}
