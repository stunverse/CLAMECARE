import { cn } from "@/lib/utils";

/**
 * Official MyDueGuard logo lockup. Expects the image at /public/logo.png.
 * The alt text ("MyDueGuard") shows if the file is missing, so nothing breaks
 * before the asset is uploaded.
 *
 * The logo sits on a forced pure-white plate so its baked-in white background
 * matches perfectly in every theme (including dark mode). Pass a height class
 * (e.g. `h-14`) via `className`; the wrapper takes the height and the image
 * fills it.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-white px-1",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="MyDueGuard"
        className="h-full w-auto object-contain"
      />
    </span>
  );
}
