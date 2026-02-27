// ============================================================================
// Verify Email Page
// ============================================================================

import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerifyEmailContent } from "@/components/auth/verify-email-content";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Verify Your Email | OnlyHalos",
  description:
    "Please verify your email address to activate your OnlyHalos account.",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VerifyEmailPage() {
  return (
    <Card className="border-border/50 bg-card/80 shadow-dark-lg backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Verify Your Email
        </CardTitle>
        <CardDescription>One last step to get started</CardDescription>
      </CardHeader>

      <CardContent>
        <VerifyEmailContent />
      </CardContent>
    </Card>
  );
}
