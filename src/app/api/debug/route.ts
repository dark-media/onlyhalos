import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const results: Record<string, any> = {};

  // Check env vars exist (don't reveal values)
  results.AUTH_SECRET = process.env.AUTH_SECRET ? "SET" : "MISSING";
  results.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "MISSING";
  results.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING";
  results.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING";
  results.DATABASE_URL = process.env.DATABASE_URL ? "SET" : "MISSING";
  results.AUTH_TRUST_HOST = process.env.AUTH_TRUST_HOST ?? "MISSING";
  results.REQUEST_URL = url.toString();

  // Test database connection
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    results.DATABASE = `CONNECTED (${userCount} users)`;
  } catch (e: any) {
    results.DATABASE = `ERROR: ${e.message}`;
  }

  // Test auth import
  try {
    const { auth } = await import("../../../../auth");
    results.AUTH_IMPORT = "OK";
  } catch (e: any) {
    results.AUTH_IMPORT = `ERROR: ${e.message}`;
  }

  // Test adapter
  try {
    const { PrismaAdapter } = await import("@auth/prisma-adapter");
    const adapter = PrismaAdapter(prisma);
    results.ADAPTER = adapter ? "OK" : "NULL";

    // Test adapter methods
    if (adapter.getUserByEmail) {
      const testUser = await adapter.getUserByEmail("test@nonexistent.com");
      results.ADAPTER_QUERY = testUser ? "FOUND" : "NO_USER (expected)";
    }
  } catch (e: any) {
    results.ADAPTER = `ERROR: ${e.message}`;
  }

  return NextResponse.json(results);
}
