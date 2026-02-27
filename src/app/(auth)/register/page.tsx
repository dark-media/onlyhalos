// ============================================================================
// Register Page
// ============================================================================

import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { RegisterForm } from "@/components/auth/register-form";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Join OnlyHalos",
  description:
    "Create your OnlyHalos account and join the premier creator platform.",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  return (
    <Card className="border-border/50 bg-card/80 shadow-dark-lg backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Create Your Account
        </CardTitle>
        <CardDescription>Join the premier creator platform</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <SocialLoginButtons />
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
