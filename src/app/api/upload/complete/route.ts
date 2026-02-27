// ============================================================================
// Upload Complete API — Confirm upload and create PostMedia record
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/cloudfront";

// ---------------------------------------------------------------------------
// POST /api/upload/complete
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
    const { key, type, width, height, duration, size } = body;

    if (!key || !type) {
      return NextResponse.json(
        { error: "key and type are required." },
        { status: 400 },
      );
    }

    if (type !== "IMAGE" && type !== "VIDEO") {
      return NextResponse.json(
        { error: "type must be IMAGE or VIDEO." },
        { status: 400 },
      );
    }

    // Verify the key belongs to this user
    if (!key.startsWith(`uploads/${session.user.id}/`)) {
      return NextResponse.json(
        { error: "Invalid upload key." },
        { status: 403 },
      );
    }

    // Determine MIME type from key extension
    const ext = key.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      avif: "image/avif",
      mp4: "video/mp4",
      mov: "video/quicktime",
      webm: "video/webm",
      avi: "video/x-msvideo",
    };
    const mimeType = mimeMap[ext] || "application/octet-stream";

    // Create PostMedia record
    // Note: The postId is not set yet; it will be linked when the post is created
    const media = await prisma.postMedia.create({
      data: {
        type,
        url: key, // Store the S3 key; signed URLs are generated on read
        width: width || null,
        height: height || null,
        duration: duration || null,
        size: size || null,
        mimeType,
        // postId is required by schema, so we create a placeholder
        // The post creation will update the postId
        post: {
          create: {
            creatorId: session.user.id,
            visibility: "PUBLIC",
            isPublished: false, // Draft post as placeholder
          },
        },
      },
    });

    return NextResponse.json({
      id: media.id,
      key,
      type,
      url: getPublicUrl(key),
      width: media.width,
      height: media.height,
    });
  } catch (err) {
    console.error("[Upload Complete] Error:", err);
    return NextResponse.json(
      { error: "Failed to confirm upload." },
      { status: 500 },
    );
  }
}
