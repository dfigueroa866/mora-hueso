/**
 * Hosts that next/image may fetch. Keep in sync with next.config.js
 * `images.remotePatterns`.
 */
const NEXT_IMAGE_HOSTS = new Set(["images.unsplash.com"]);

function isBlobHost(hostname: string) {
  return hostname.endsWith(".public.blob.vercel-storage.com");
}

function isGoogleDriveHost(hostname: string) {
  return (
    hostname === "drive.google.com" ||
    hostname === "docs.google.com" ||
    hostname.endsWith(".googleusercontent.com")
  );
}

function driveFileId(src: string): string | null {
  const fileMatch = src.match(
    /(?:drive|docs)\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i
  );
  if (fileMatch?.[1]) return fileMatch[1];
  if (!/(?:drive|docs)\.google\.com/i.test(src)) return null;
  const queryMatch = src.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  return queryMatch?.[1] ?? null;
}

/**
 * Google Drive share links are not reliable for hotlinking (often need login
 * and flood the browser with failed requests). Treat them as missing so the
 * page stays up until Blob / local URLs are set.
 */
export function normalizeProductImageSrc(src: unknown): string {
  if (typeof src !== "string") return "";
  const raw = src.trim();
  if (!raw) return raw;
  if (driveFileId(raw)) return "";
  try {
    const host = new URL(raw).hostname;
    if (isGoogleDriveHost(host)) return "";
  } catch {
    // relative paths are fine
  }
  return raw;
}

export function canUseNextImage(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const { protocol, hostname } = new URL(src);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (NEXT_IMAGE_HOSTS.has(hostname)) return true;
    if (isBlobHost(hostname)) return true;
    return false;
  } catch {
    return false;
  }
}
