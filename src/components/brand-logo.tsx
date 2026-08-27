import { cn } from "@/lib/utils";

/**
 * Official MyDueGuard logo lockup. Expects the image at /public/logo.png.
 * The alt text ("MyDueGuard") shows if the file is missing, so nothing breaks
 * before the asset is uploaded.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="MyDueGuard"
      className={cn("w-auto object-contain", className)}
    />
  );
}
