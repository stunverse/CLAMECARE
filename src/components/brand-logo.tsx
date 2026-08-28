import { cn } from "@/lib/utils";

/**
 * Official MyDueGuard wordmark — a pure-text lockup (no image asset) topped
 * with a small shield-check symbol, so it stays crisp at every size and
 * adapts to light/dark themes.
 *
 * "MyDue" uses the theme foreground; "Guard" uses the brand blue gradient.
 * A subtle embossed text-shadow / drop-shadow gives the wordmark relief.
 *
 * Everything scales from the font size: pass a text-size class (e.g.
 * `text-2xl`) via `className` and the symbol (sized in `em`) follows.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex select-none flex-col items-center whitespace-nowrap font-extrabold leading-none tracking-tight text-2xl",
        className,
      )}
      aria-label="MyDueGuard"
    >
      <BrandSymbol className="mb-[0.12em] h-[0.92em] w-[0.92em] drop-shadow-[0_1px_2px_rgba(37,99,235,0.45)]" />
      <span className="inline-flex items-baseline leading-none">
        <span className="text-foreground [text-shadow:0_1px_0_rgba(255,255,255,0.55),0_2px_3px_rgba(10,37,64,0.28)]">
          MyDue
        </span>
        <span className="bg-gradient-to-br from-brand to-sky-400 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(37,99,235,0.4)]">
          Guard
        </span>
      </span>
    </span>
  );
}

/**
 * The MyDueGuard mark: a shield (protection / "Guard") holding a check
 * (facture réglée). Filled with the brand blue gradient; a lighter top edge
 * gives it relief.
 */
export function BrandSymbol({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="MyDueGuard"
    >
      <defs>
        <linearGradient id="mdg-shield" x1="4" y1="2" x2="20" y2="22">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="0.55" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.6 20.4 4.8 V11.2 C20.4 16.4 16.8 20.4 12 22.4 C7.2 20.4 3.6 16.4 3.6 11.2 V4.8 Z"
        fill="url(#mdg-shield)"
      />
      <path
        d="M12 1.6 20.4 4.8 V6 C20.4 5 12 1.9 12 1.9 Z"
        fill="#ffffff"
        opacity="0.18"
      />
      <path
        d="M8 11.9 11 14.9 16.2 8.8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
