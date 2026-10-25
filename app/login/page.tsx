import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign in — LeadFlow AI" };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
