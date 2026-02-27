// ============================================================================
// Admin User Management Page
// ============================================================================

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { UserTable } from "@/components/admin/user-table";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "User Management | Admin | OnlyHalos",
  description: "Manage platform users, roles, and access",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const totalUsers = await prisma.user.count();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <Users className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            {totalUsers.toLocaleString()} registered users
          </p>
        </div>
      </div>

      {/* User Table */}
      <UserTable />
    </div>
  );
}
