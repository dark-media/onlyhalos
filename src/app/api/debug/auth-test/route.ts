import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Try to instantiate NextAuth exactly like auth.ts does
    const result = NextAuth({
      adapter: PrismaAdapter(prisma) as any,
      session: { strategy: "jwt" },
      providers: [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          allowDangerousEmailAccountLinking: true,
        }),
      ],
      pages: {
        signIn: "/login",
        error: "/login",
      },
    });

    return NextResponse.json({
      status: "OK",
      hasHandlers: !!result.handlers,
      hasAuth: !!result.auth,
    });
  } catch (e: any) {
    return NextResponse.json({
      status: "ERROR",
      error: e.message,
      stack: e.stack?.split("\n").slice(0, 5),
    });
  }
}
