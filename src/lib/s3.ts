import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// S3 Client
// ---------------------------------------------------------------------------

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FileCategory = "image" | "video";

export interface PresignedUploadResult {
  url: string;
  key: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Returns the file category ("image" | "video") if the content type is
 * allowed, or `null` if the type is not permitted.
 */
export function getFileCategory(contentType: string): FileCategory | null {
  if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType)) {
    return "image";
  }
  if ((ALLOWED_VIDEO_TYPES as readonly string[]).includes(contentType)) {
    return "video";
  }
  return null;
}

/**
 * Returns the maximum upload size in bytes for a given file category.
 */
export function getMaxSizeForCategory(category: FileCategory): number {
  return category === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
}

/**
 * Validates that `contentType` is allowed and that `fileSize` (in bytes)
 * does not exceed the limit for the resolved category.
 *
 * @throws {Error} when the content type is not allowed or the file is too large.
 */
export function validateFile(contentType: string, fileSize: number): FileCategory {
  const category = getFileCategory(contentType);

  if (!category) {
    throw new Error(
      `File type "${contentType}" is not allowed. ` +
        `Accepted types: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(", ")}`,
    );
  }

  const maxSize = getMaxSizeForCategory(category);

  if (fileSize > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    throw new Error(
      `File size exceeds the ${maxMB} MB limit for ${category} uploads.`,
    );
  }

  return category;
}

// ---------------------------------------------------------------------------
// Presigned Upload URL
// ---------------------------------------------------------------------------

/**
 * Generates a presigned PUT URL that a client can use to upload directly to S3.
 *
 * @param key         - The S3 object key (e.g. `"uploads/user-123/abc.jpg"`).
 * @param contentType - The MIME type of the file to upload.
 * @param maxSize     - Optional maximum content-length override (bytes).
 *                      Defaults to the limit for the resolved file category.
 * @param expiresIn   - URL lifetime in seconds (default 300 = 5 minutes).
 *
 * @returns An object containing the presigned `url` and the `key`.
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  maxSize?: number,
  expiresIn: number = 300,
): Promise<PresignedUploadResult> {
  const category = getFileCategory(contentType);

  if (!category) {
    throw new Error(`File type "${contentType}" is not allowed.`);
  }

  const resolvedMaxSize = maxSize ?? getMaxSizeForCategory(category);

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: resolvedMaxSize,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });

  return { url, key };
}

// ---------------------------------------------------------------------------
// Delete Object
// ---------------------------------------------------------------------------

/**
 * Deletes an object from S3 by key.
 *
 * @param key - The S3 object key to delete.
 */
export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}
