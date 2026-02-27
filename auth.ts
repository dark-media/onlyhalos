// ============================================================================
// NextAuth v5 Configuration
// ============================================================================

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid email or password.");
        }

        if (user.status === "BANNED") {
          throw new Error(
            "Your account has been banned. Please contact support."
          );
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.avatarUrl,
          role: user.role,
          username: user.username,
          isCreator: user.isCreator,
          avatarUrl: user.avatarUrl,
          stripeCustomerId: user.stripeCustomerId,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // For OAuth providers, look up user status from DB
      if (account?.provider !== "credentials") {
        if (user.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { status: true },
          });

          if (dbUser?.status === "BANNED") {
            return false;
          }

          if (dbUser?.status === "SUSPENDED") {
            return false;
          }
        }
        return true;
      }

      // For credentials, status is already checked in authorize()
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, populate token from user object
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.username = user.username;
        token.isCreator = user.isCreator;
        token.avatarUrl = user.avatarUrl;
        token.stripeCustomerId = user.stripeCustomerId;
      }

      // On session update (e.g. after profile changes), refresh from DB
      if (trigger === "update" && session) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            username: true,
            isCreator: true,
            avatarUrl: true,
            stripeCustomerId: true,
            displayName: true,
            email: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.username = dbUser.username;
          token.isCreator = dbUser.isCreator;
          token.avatarUrl = dbUser.avatarUrl;
          token.stripeCustomerId = dbUser.stripeCustomerId;
          token.name = dbUser.displayName;
          token.email = dbUser.email;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.username = token.username as string | null;
        session.user.isCreator = token.isCreator as boolean;
        session.user.avatarUrl = token.avatarUrl as string | null;
        session.user.stripeCustomerId = token.stripeCustomerId as string | null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // When a user is created via OAuth, generate a default username
      if (user.id && !user.username) {
        const baseUsername = (user.email?.split("@")[0] ?? "user")
          .replace(/[^a-zA-Z0-9_]/g, "")
          .toLowerCase()
          .slice(0, 25);

        let username = baseUsername;
        let suffix = 1;

        // Ensure username uniqueness
        while (await prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername}${suffix}`;
          suffix++;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { username },
        });
      }
    },
  },
});
