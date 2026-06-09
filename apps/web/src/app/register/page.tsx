/**
 * Registration Page
 * WebAuthn/Passkey registration page.
 */

"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fingerprint, ArrowLeft, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PasskeyRegister } from "@/components/auth/passkey-register";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const handleRegister = async (email: string, displayName: string) => {
    await register(email, displayName);
    router.push("/chat");
  };

  return (
    <div className="min-h-screen bg-kalen-bg flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-kalen-agent/10 via-kalen-bg to-kalen-accent/10" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-kalen-agent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-kalen-accent/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col justify-center px-12 xl:px-20">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kalen-primary to-kalen-accent flex items-center justify-center font-bold text-white">
              K
            </div>
            <span className="text-2xl font-bold text-gradient-primary">KALEN</span>
          </Link>

          <h2 className="text-4xl font-bold text-kalen-text mb-4">
            Join the Network
          </h2>
          <p className="text-lg text-kalen-text-secondary max-w-md leading-relaxed">
            Create your identity with a passkey. No passwords. No phishing. Just
            your device&apos;s biometric authentication.
          </p>

          <div className="mt-12 space-y-4">
            {[
              "Face ID, Touch ID, or fingerprint",
              "Device-bound credentials — can't be phished",
              "Public key only stored server-side",
              "Recovery phrase for device loss",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-kalen-agent/10 flex items-center justify-center">
                  <Shield size={12} className="text-kalen-agent" />
                </div>
                <span className="text-sm text-kalen-text-secondary">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — registration form */}
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
            <div className="w-14 h-14 rounded-2xl bg-kalen-agent/10 border border-kalen-agent/20 flex items-center justify-center mb-6 lg:hidden">
              <Fingerprint size={28} className="text-kalen-agent" />
            </div>
            <h1 className="text-2xl font-bold text-kalen-text mb-2">Create Account</h1>
            <p className="text-sm text-kalen-text-secondary">
              Register with a passkey to join KALEN.
            </p>
          </div>

          <PasskeyRegister onRegister={handleRegister} isLoading={isLoading} />

          <div className="mt-8 text-center">
            <p className="text-sm text-kalen-text-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-kalen-primary hover:text-kalen-primary-hover font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
