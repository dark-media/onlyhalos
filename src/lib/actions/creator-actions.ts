// ============================================================================
// Creator Server Actions
// ============================================================================

"use server";

import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { becomeCreatorSchema } from "@/lib/validations/user";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// becomeCreator — Apply to become a creator
// ---------------------------------------------------------------------------

export async function becomeCreator(formData: FormData): Promise<ActionResult> {
  try {
    // ── Auth check ──────────────────────────────────────────────────
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be signed in to become a creator.",
      };
    }

    // ── Check if already a creator ──────────────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isCreator: true, role: true, status: true },
    });

    if (!existingUser) {
      return { success: false, error: "User not found." };
    }

    if (existingUser.isCreator) {
      return { success: false, error: "You are already a creator." };
    }

    if (existingUser.status !== "ACTIVE") {
      return {
        success: false,
        error: "Your account must be active to become a creator.",
      };
    }

    // ── Validate input ──────────────────────────────────────────────
    const rawInput = {
      creatorBio: formData.get("creatorBio"),
      categories: formData.getAll("categories"),
    };

    const parsed = becomeCreatorSchema.safeParse(rawInput);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? "Invalid input.",
      };
    }

    const { creatorBio, categories } = parsed.data;

    // ── Update user to creator ──────────────────────────────────────
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update user role and creator status
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          isCreator: true,
          role: "CREATOR",
          creatorBio,
        },
      });

      // Link categories
      if (categories.length > 0) {
        // Find or create categories
        for (const categoryName of categories) {
          const category = await tx.category.upsert({
            where: { slug: categoryName.toLowerCase().replace(/\s+/g, "-") },
            update: {},
            create: {
              name: categoryName,
              slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
            },
          });

          await tx.creatorCategory.create({
            data: {
              userId: session.user.id,
              categoryId: category.id,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("[becomeCreator] Error:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

// ---------------------------------------------------------------------------
// updateCreatorProfile — Update creator-specific profile fields
// ---------------------------------------------------------------------------

export async function updateCreatorProfile(
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ── Auth check ──────────────────────────────────────────────────
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be signed in.",
      };
    }

    // ── Check if user is a creator ──────────────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isCreator: true },
    });

    if (!existingUser?.isCreator) {
      return {
        success: false,
        error: "You must be a creator to update creator settings.",
      };
    }

    // ── Extract and validate fields ─────────────────────────────────
    const creatorBio = formData.get("creatorBio") as string | null;
    const categoriesRaw = formData.getAll("categories") as string[];

    // Validate creator bio if provided
    if (creatorBio !== null) {
      if (creatorBio.length < 20) {
        return {
          success: false,
          error: "Creator bio must be at least 20 characters.",
        };
      }
      if (creatorBio.length > 1000) {
        return {
          success: false,
          error: "Creator bio must be at most 1000 characters.",
        };
      }
    }

    // ── Update profile ──────────────────────────────────────────────
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update creator bio
      const updateData: Record<string, unknown> = {};
      if (creatorBio !== null) {
        updateData.creatorBio = creatorBio;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: updateData,
        });
      }

      // Update categories if provided
      if (categoriesRaw.length > 0) {
        // Remove existing categories
        await tx.creatorCategory.deleteMany({
          where: { userId: session.user.id },
        });

        // Add new categories
        for (const categoryName of categoriesRaw) {
          const category = await tx.category.upsert({
            where: {
              slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
            },
            update: {},
            create: {
              name: categoryName,
              slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
            },
          });

          await tx.creatorCategory.create({
            data: {
              userId: session.user.id,
              categoryId: category.id,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("[updateCreatorProfile] Error:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
