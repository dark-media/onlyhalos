import { getSignedUrl as cfGetSignedUrl } from "@aws-sdk/cloudfront-signer";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN!;
const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID!;
const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY!;

/** Default signed-URL lifetime: 10 minutes (in milliseconds). */
const DEFAULT_TTL_MS = 10 * 60 * 1000;

// ---------------------------------------------------------------------------
// Signed URL (private / paid content)
// ---------------------------------------------------------------------------

/**
 * Returns a CloudFront signed URL for a private S3 object.
 *
 * @param key   - The S3 object key (path portion of the URL).
 * @param ttlMs - Time-to-live in milliseconds (default 10 minutes).
 */
export function getSignedUrl(key: string, ttlMs: number = DEFAULT_TTL_MS): string {
  const url = `https://${CLOUDFRONT_DOMAIN}/${key}`;
  const dateLessThan = new Date(Date.now() + ttlMs).toISOString();

  return cfGetSignedUrl({
    url,
    keyPairId: CLOUDFRONT_KEY_PAIR_ID,
    privateKey: CLOUDFRONT_PRIVATE_KEY,
    dateLessThan,
  });
}

// ---------------------------------------------------------------------------
// Public URL (avatars, covers, public assets)
// ---------------------------------------------------------------------------

/**
 * Returns an unsigned (public) CloudFront URL for assets that do not require
 * access control — e.g. avatars and cover images.
 *
 * @param key - The S3 object key.
 */
export function getPublicUrl(key: string): string {
  return `https://${CLOUDFRONT_DOMAIN}/${key}`;
}
