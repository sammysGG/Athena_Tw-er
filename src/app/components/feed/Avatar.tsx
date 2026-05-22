import { initials } from "@/app/lib/format";

export default function Avatar({ name, size = 40 }: { name: string; size?: number }) {
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
