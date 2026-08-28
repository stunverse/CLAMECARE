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
      <BrandSymbol className="mb-[0.1em] h-[1.55em] w-[1.55em] drop-shadow-[0_3px_5px_rgba(30,58,138,0.5)]" />
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
 * (facture réglée). Glossy blue body with a specular highlight and a beveled
 * rim for a raised, shiny 3D feel.
 */
export function BrandSymbol({ className }: { className?: string }) {
  const shield =
    "M12 1.6 20.4 4.8 V11.2 C20.4 16.4 16.8 20.4 12 22.4 C7.2 20.4 3.6 16.4 3.6 11.2 V4.8 Z";
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="MyDueGuard"
    >
      <defs>
        {/* Body: bright top rolling into a deep blue base for volume. */}
        <linearGradient id="mdg-body" x1="12" y1="1.6" x2="12" y2="22.4">
          <stop offset="0" stopColor="#7cb6ff" />
          <stop offset="0.45" stopColor="#2f7bf6" />
          <stop offset="0.78" stopColor="#1d54c9" />
          <stop offset="1" stopColor="#132f7a" />
        </linearGradient>
        {/* Specular gloss centered on the upper dome. */}
        <radialGradient id="mdg-spec" cx="0.42" cy="0.16" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* Glassy sheen band across the top half. */}
        <linearGradient id="mdg-sheen" x1="12" y1="1.6" x2="12" y2="12.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Beveled rim (darker edge behind the body). */}
      <path d={shield} fill="#0f2a6b" transform="translate(0 0.35)" />
      {/* Main glossy body. */}
      <path d={shield} fill="url(#mdg-body)" />
      {/* Top sheen. */}
      <path
        d="M12 1.6 20.4 4.8 V8.2 C17.6 10.6 6.4 10.6 3.6 8.2 V4.8 Z"
        fill="url(#mdg-sheen)"
      />
      {/* Specular highlight. */}
      <path d={shield} fill="url(#mdg-spec)" />
      {/* Bright inner rim highlight for the raised bevel. */}
      <path
        d={shield}
        fill="none"
        stroke="#dbeafe"
        strokeOpacity="0.55"
        strokeWidth="0.7"
      />
      {/* The check — facture réglée. */}
      <path
        d="M7.7 11.9 11 15.1 16.5 8.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
