import { cn } from "@/lib/utils";

/**
 * Official MyDueGuard wordmark — a pure-text lockup (no image asset) so it
 * stays crisp at every size and adapts to light/dark themes.
 *
 * "MyDue" uses the theme foreground; "Guard" uses the brand blue gradient.
 * A subtle embossed text-shadow / drop-shadow gives the wordmark relief.
 *
 * Pass a text-size class (e.g. `text-2xl`) via `className` to scale it.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-baseline whitespace-nowrap font-extrabold leading-none tracking-tight text-2xl",
        className,
      )}
      aria-label="MyDueGuard"
    >
      <span className="text-foreground [text-shadow:0_1px_0_rgba(255,255,255,0.55),0_2px_3px_rgba(10,37,64,0.28)]">
        MyDue
      </span>
      <span className="bg-gradient-to-br from-brand to-sky-400 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(37,99,235,0.4)]">
        Guard
      </span>
    </span>
  );
}
