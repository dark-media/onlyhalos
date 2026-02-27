// ============================================================================
// Admin Report Resolution API
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// PATCH /api/admin/reports/[reportId] — Resolve or dismiss a report
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: { reportId: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const { reportId } = params;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true, reportedUserId: true },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found." },
        { status: 404 },
      );
    }

    const body = await req.json();

    // Validate status
    if (!body.status || !["RESOLVED", "DISMISSED", "REVIEWING"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be RESOLVED, DISMISSED, or REVIEWING." },
        { status: 400 },
      );
    }

    // Build update
    const updateData: Record<string, unknown> = {
      status: body.status,
      resolvedById: session.user.id,
    };

    if (body.status === "RESOLVED" || body.status === "DISMISSED") {
      updateData.resolvedAt = new Date();
    }

    if (body.adminNote !== undefined) {
      updateData.adminNote = body.adminNote;
    }

    // Update report
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: updateData,
      include: {
        reporter: {
          select: { id: true, username: true, displayName: true },
        },
        reportedUser: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });

    // Optionally ban the reported user
    if (body.banReportedUser && report.reportedUserId) {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { status: "BANNED" },
      });
    }

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error("[ADMIN_REPORT_UPDATE]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
