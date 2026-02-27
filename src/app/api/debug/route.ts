import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const results: Record<string, string> = {};

  // Check env vars exist (don't reveal values)
  results.AUTH_SECRET = process.env.AUTH_SECRET ? "SET" : "MISSING";
  results.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "MISSING";
  results.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING";
  results.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING";
  results.DATABASE_URL = process.env.DATABASE_URL ? "SET" : "MISSING";
  results.AUTH_TRUST_HOST = process.env.AUTH_TRUST_HOST ?? "MISSING";

  // Test database connection
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    results.DATABASE = `CONNECTED (${userCount} users)`;
  } catch (e: any) {
    results.DATABASE = `ERROR: ${e.message}`;
  }

  return NextResponse.json(results);
}
