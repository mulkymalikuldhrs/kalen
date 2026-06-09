/**
 * Passkey Registration Component
 * WebAuthn registration flow using @simplewebauthn/browser.
 */

"use client";

import React, { useState } from "react";
import { Fingerprint, Mail, User, Loader2, ShieldCheck } from "lucide-react";

interface PasskeyRegisterProps {
  onRegister: (email: string, displayName: string) => Promise<void>;
  isLoading?: boolean;
}

export function PasskeyRegister({ onRegister, isLoading }: PasskeyRegisterProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "authenticating" | "success">("form");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    try {
      setStep("authenticating");
      await onRegister(email, displayName);
      setStep("success");
    } catch (err) {
      setStep("form");
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  if (step === "success") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-kalen-success/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={32} className="text-kalen-success" />
        </div>
        <h3 className="text-xl font-semibold text-kalen-text mb-2">
          Welcome to KALEN!
        </h3>
        <p className="text-sm text-kalen-text-secondary">
          Your passkey has been registered successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display Name */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-kalen-text-secondary mb-1.5">
          Display Name
        </label>
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kalen-text-muted" />
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
            disabled={isLoading || step === "authenticating"}
            className="w-full bg-kalen-bg border border-kalen-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-kalen-text placeholder:text-kalen-text-muted focus:outline-none focus:border-kalen-primary focus:ring-1 focus:ring-kalen-primary/20 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-kalen-text-secondary mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kalen-text-muted" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isLoading || step === "authenticating"}
            className="w-full bg-kalen-bg border border-kalen-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-kalen-text placeholder:text-kalen-text-muted focus:outline-none focus:border-kalen-primary focus:ring-1 focus:ring-kalen-primary/20 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-kalen-error/10 border border-kalen-error/20 text-kalen-error text-sm">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading || step === "authenticating"}
        className="w-full flex items-center justify-center gap-2 bg-kalen-primary text-white rounded-lg px-4 py-3 text-sm font-semibold hover:bg-kalen-primary-hover glow-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {step === "authenticating" || isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Authenticating with passkey...
          </>
        ) : (
          <>
            <Fingerprint size={18} />
            Register with Passkey
          </>
        )}
      </button>

      <p className="text-xs text-kalen-text-muted text-center">
        Your passkey uses your device&apos;s biometric authentication (Face ID, fingerprint, or PIN).
        No password required.
      </p>
    </form>
  );
}
