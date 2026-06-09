/**
 * Passkey Login Component
 * WebAuthn authentication flow using @simplewebauthn/browser.
 */

"use client";

import React, { useState } from "react";
import { Fingerprint, Mail, Loader2, KeyRound } from "lucide-react";

interface PasskeyLoginProps {
  onLogin: (email: string) => Promise<void>;
  isLoading?: boolean;
}

export function PasskeyLogin({ onLogin, isLoading }: PasskeyLoginProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setIsAuthenticating(true);
      await onLogin(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasskeyLogin = async () => {
    // TODO: Implement conditional UI / discoverable credential login
    // This would use navigator.credentials.get() without specifying allowCredentials
    // to let the browser show the passkey picker
    setError("Passkey auto-detect is not yet implemented. Please enter your email.");
  };

  return (
    <div className="space-y-4">
      {/* Quick passkey login */}
      <button
        onClick={handlePasskeyLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-kalen-surface-2 border border-kalen-border text-kalen-text rounded-lg px-4 py-3 text-sm font-semibold hover:bg-kalen-surface-3 hover:border-kalen-border-light transition-colors disabled:opacity-50"
      >
        <KeyRound size={18} />
        Sign in with Passkey
      </button>

      <div className="relative flex items-center gap-4">
        <div className="flex-1 border-t border-kalen-border" />
        <span className="text-xs text-kalen-text-muted">or</span>
        <div className="flex-1 border-t border-kalen-border" />
      </div>

      {/* Email form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-kalen-text-secondary mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kalen-text-muted" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading || isAuthenticating}
              className="w-full bg-kalen-bg border border-kalen-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-kalen-text placeholder:text-kalen-text-muted focus:outline-none focus:border-kalen-primary focus:ring-1 focus:ring-kalen-primary/20 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-kalen-error/10 border border-kalen-error/20 text-kalen-error text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || isAuthenticating}
          className="w-full flex items-center justify-center gap-2 bg-kalen-primary text-white rounded-lg px-4 py-3 text-sm font-semibold hover:bg-kalen-primary-hover glow-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAuthenticating || isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <Fingerprint size={18} />
              Continue with Passkey
            </>
          )}
        </button>
      </form>
    </div>
  );
}
