// ============================================================================
// Forgot Password Page
// ============================================================================

import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Forgot Password | OnlyHalos",
  description: "Reset your OnlyHalos account password.",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ForgotPasswordPage() {
  return (
    <Card className="border-border/50 bg-card/80 shadow-dark-lg backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Reset Password
        </CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to reset your password
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
