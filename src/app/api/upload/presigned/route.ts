// ============================================================================
// Presigned Upload URL API — Generate S3 presigned PUT URL
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { validateFile, generatePresignedUploadUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// POST /api/upload/presigned
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { fileName, contentType, fileSize } = body;

    if (!fileName || !contentType || !fileSize) {
      return NextResponse.json(
        { error: "fileName, contentType, and fileSize are required." },
        { status: 400 },
      );
    }

    // Validate file type and size
    let category: "image" | "video";
    try {
      category = validateFile(contentType, fileSize);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid file." },
        { status: 400 },
      );
    }

    // Generate unique S3 key
    const ext = fileName.split(".").pop()?.toLowerCase() || "bin";
    const uniqueId = crypto.randomUUID();
    const key = `uploads/${session.user.id}/${uniqueId}.${ext}`;

    // Generate presigned URL
    const { url } = await generatePresignedUploadUrl(key, contentType);

    return NextResponse.json({
      presignedUrl: url,
      key,
      contentType,
    });
  } catch (err) {
    console.error("[Upload Presigned] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL." },
      { status: 500 },
    );
  }
}
