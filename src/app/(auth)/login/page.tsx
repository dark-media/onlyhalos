// ============================================================================
// Login Page
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
import { LoginForm } from "@/components/auth/login-form";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Log In | OnlyHalos",
  description:
    "Log in to your OnlyHalos account to access exclusive creator content.",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  return (
    <Card className="border-border/50 bg-card/80 shadow-dark-lg backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Welcome Back
        </CardTitle>
        <CardDescription>Sign in to continue to OnlyHalos</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <SocialLoginButtons />
        <LoginForm />
      </CardContent>
    </Card>
  );
}
