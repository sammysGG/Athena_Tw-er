import { initials } from "@/app/lib/format";

type Props = {
  name: string;
  size?: number;
  src?: string | null;
};

export default function Avatar({ name, size = 40, src }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${name} avatar`}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 bg-gray-200 dark:bg-white/10"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-primary text-white flex items-center justify-center font-semibold shrink-0 select-none"
      aria-hidden
    >
      {initials(name || "?")}
    </div>
  );
}
