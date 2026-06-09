/**
 * Login Page
 * WebAuthn/Passkey authentication page.
 */

"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fingerprint, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PasskeyLogin } from "@/components/auth/passkey-login";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const handleLogin = async (email: string) => {
    await login(email);
    router.push("/chat");
  };

  return (
    <div className="min-h-screen bg-kalen-bg flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-kalen-primary/10 via-kalen-bg to-kalen-agent/10" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-kalen-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-kalen-agent/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col justify-center px-12 xl:px-20">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kalen-primary to-kalen-accent flex items-center justify-center font-bold text-white">
              K
            </div>
            <span className="text-2xl font-bold text-gradient-primary">KALEN</span>
          </Link>

          <h2 className="text-4xl font-bold text-kalen-text mb-4">
            Welcome back
          </h2>
          <p className="text-lg text-kalen-text-secondary max-w-md leading-relaxed">
            Sign in with your passkey to access your conversations, agents, and tools.
          </p>

          <div className="mt-12 space-y-4">
            {[
              "Passwordless — your biometric is your key",
              "End-to-end encrypted by default",
              "No credentials stored on our servers",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-kalen-success/10 flex items-center justify-center">
                  <span className="text-kalen-success text-xs">✓</span>
                </div>
                <span className="text-sm text-kalen-text-secondary">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-kalen-text-muted hover:text-kalen-text transition-colors mb-8 lg:hidden"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-kalen-primary/10 border border-kalen-primary/20 flex items-center justify-center mb-6 lg:hidden">
              <Fingerprint size={28} className="text-kalen-primary" />
            </div>
            <h1 className="text-2xl font-bold text-kalen-text mb-2">Sign In</h1>
            <p className="text-sm text-kalen-text-secondary">
              Use your registered passkey to authenticate.
            </p>
          </div>

          <PasskeyLogin onLogin={handleLogin} isLoading={isLoading} />

          <div className="mt-8 text-center">
            <p className="text-sm text-kalen-text-muted">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-kalen-primary hover:text-kalen-primary-hover font-medium transition-colors"
              >
                Register with Passkey
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
