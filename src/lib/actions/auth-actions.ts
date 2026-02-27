// ============================================================================
// Auth Server Actions
// ============================================================================

"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { registerSchema } from "@/lib/validations/auth";

interface ActionResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export async function registerUser(formData: FormData): Promise<ActionResult> {
  try {
    // ------------------------------------------------------------------
    // 1. Extract and validate input
    // ------------------------------------------------------------------
    const rawInput = {
      email: formData.get("email"),
      password: formData.get("password"),
      username: formData.get("username"),
      displayName: formData.get("displayName"),
    };

    const parsed = registerSchema.safeParse(rawInput);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? "Invalid input.",
      };
    }

    const { email, password, username, displayName } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // ------------------------------------------------------------------
    // 2. Check for existing email
    // ------------------------------------------------------------------
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingEmail) {
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }

    // ------------------------------------------------------------------
    // 3. Check for existing username
    // ------------------------------------------------------------------
    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    });

    if (existingUsername) {
      return {
        success: false,
        error: "This username is already taken.",
      };
    }

    // ------------------------------------------------------------------
    // 4. Hash password
    // ------------------------------------------------------------------
    const hashedPassword = await bcrypt.hash(password, 12);

    // ------------------------------------------------------------------
    // 5. Create Stripe customer
    // ------------------------------------------------------------------
    let stripeCustomerId: string | null = null;

    try {
      const stripeCustomer = await stripe.customers.create({
        email: normalizedEmail,
        name: displayName,
        metadata: {
          username: normalizedUsername,
        },
      });
      stripeCustomerId = stripeCustomer.id;
    } catch (stripeError) {
      console.error("[registerUser] Stripe customer creation failed:", stripeError);
      // Continue without Stripe customer - can be created later
    }

    // ------------------------------------------------------------------
    // 6. Create user in database
    // ------------------------------------------------------------------
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        hashedPassword,
        username: normalizedUsername,
        displayName,
        stripeCustomerId,
      },
      select: { id: true },
    });

    return {
      success: true,
      userId: user.id,
    };
  } catch (error) {
    console.error("[registerUser] Unexpected error:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
