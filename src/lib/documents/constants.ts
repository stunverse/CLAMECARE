/** Upload constraints for the claim document vault (§11/§33). */

export const DEFAULT_BUCKET = "claim-documents";

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

/** Allowed MIME types mapped to a short label. Mirrors the storage bucket. */
export const ACCEPTED_MIME: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
};

/** `accept` attribute for the file input. */
export const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

export function isAllowedMime(mime: string): boolean {
  return mime in ACCEPTED_MIME;
}

/** Sanitize a filename for use inside a storage object path. */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}
