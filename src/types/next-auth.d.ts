// ============================================================================
// NextAuth v5 Type Augmentation
// ============================================================================

import { UserRole } from "@prisma/client";
import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      username: string | null;
      isCreator: boolean;
      avatarUrl: string | null;
      stripeCustomerId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    username: string | null;
    isCreator: boolean;
    avatarUrl: string | null;
    stripeCustomerId: string | null;
    status: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    username: string | null;
    isCreator: boolean;
    avatarUrl: string | null;
    stripeCustomerId: string | null;
  }
}
