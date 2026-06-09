/**
 * Settings Page
 * User settings for profile, notifications, and security.
 */

"use client";

import React, { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Key,
  Palette,
  Globe,
  Trash2,
  Fingerprint,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { IdentityBadge } from "@/components/identity/identity-badge";
import { clsx } from "clsx";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
] as const;

export default function SettingsPage() {
  const { identity } = useAuth();
  const [activeSection, setActiveSection] = useState<string>("profile");

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-kalen-text mb-6 flex items-center gap-3">
          <Shield size={28} className="text-kalen-primary" />
          Settings
        </h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar nav */}
          <nav className="w-full md:w-56 flex-shrink-0">
            <div className="space-y-1">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                    activeSection === section.id
                      ? "bg-kalen-primary/10 text-kalen-primary"
                      : "text-kalen-text-secondary hover:bg-kalen-surface-2 hover:text-kalen-text"
                  )}
                >
                  <section.icon size={18} />
                  {section.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1">
            {activeSection === "profile" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-kalen-border bg-kalen-surface p-6">
                  <h2 className="text-lg font-semibold text-kalen-text mb-4">Profile</h2>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-kalen-primary/20 flex items-center justify-center text-kalen-primary text-2xl font-bold">
                      {identity?.kind === "human"
                        ? identity.identity.displayName[0]?.toUpperCase()
                        : "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-kalen-text">
                          {identity?.kind === "human"
                            ? identity.identity.displayName
                            : "Unknown"}
                        </span>
                        {identity && <IdentityBadge kind={identity.kind} size="md" />}
                      </div>
                      <p className="text-sm text-kalen-text-muted">
                        {identity?.kind === "human" ? identity.identity.email : ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-kalen-text-secondary mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        defaultValue={
                          identity?.kind === "human"
                            ? identity.identity.displayName
                            : ""
                        }
                        className="w-full bg-kalen-bg border border-kalen-border rounded-lg px-4 py-2.5 text-sm text-kalen-text focus:outline-none focus:border-kalen-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-kalen-text-secondary mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={
                          identity?.kind === "human"
                            ? identity.identity.email
                            : ""
                        }
                        disabled
                        className="w-full bg-kalen-bg border border-kalen-border rounded-lg px-4 py-2.5 text-sm text-kalen-text-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-kalen-text-muted mt-1">
                        Email cannot be changed after registration
                      </p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-kalen-primary text-white rounded-lg text-sm font-medium hover:bg-kalen-primary-hover transition-colors">
                      <Save size={16} />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-kalen-border bg-kalen-surface p-6">
                  <h2 className="text-lg font-semibold text-kalen-text mb-4">
                    Security & Authentication
                  </h2>

                  {/* Passkeys */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-kalen-surface-2 border border-kalen-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-kalen-primary/10 flex items-center justify-center">
                          <Fingerprint size={20} className="text-kalen-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-kalen-text">
                            Primary Passkey
                          </p>
                          <p className="text-xs text-kalen-text-muted">
                            Registered on{" "}
                            {identity?.kind === "human"
                              ? new Date(identity.identity.createdAt).toLocaleDateString()
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-kalen-success/10 text-kalen-success text-xs font-medium">
                        Active
                      </span>
                    </div>

                    <button className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-kalen-border text-sm text-kalen-text-muted hover:text-kalen-text hover:border-kalen-border-light transition-colors">
                      <Key size={16} />
                      Add Another Passkey
                    </button>
                  </div>

                  {/* TODO: Recovery phrase section */}
                  <div className="mt-6 pt-6 border-t border-kalen-border">
                    <h3 className="text-sm font-semibold text-kalen-text mb-3">
                      Recovery Options
                    </h3>
                    <p className="text-sm text-kalen-text-muted mb-4">
                      TODO: Recovery phrase management will be available in a future update.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="rounded-xl border border-kalen-border bg-kalen-surface p-6">
                <h2 className="text-lg font-semibold text-kalen-text mb-4">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    { label: "Direct messages", description: "Notify on new DMs" },
                    { label: "Group messages", description: "Notify on group chat activity" },
                    { label: "Agent task updates", description: "Notify when agents complete tasks" },
                    { label: "MCP tool results", description: "Notify on tool invocation results" },
                    { label: "A2A task events", description: "Notify on inter-agent task events" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-3 border-b border-kalen-border last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-kalen-text">{item.label}</p>
                        <p className="text-xs text-kalen-text-muted">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-9 h-5 bg-kalen-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-kalen-primary" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "appearance" && (
              <div className="rounded-xl border border-kalen-border bg-kalen-surface p-6">
                <h2 className="text-lg font-semibold text-kalen-text mb-4">Appearance</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-kalen-text-secondary mb-2">
                      Theme
                    </label>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 rounded-lg bg-kalen-surface-2 border-2 border-kalen-primary text-sm text-kalen-text font-medium">
                        Dark
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-kalen-surface-2 border border-kalen-border text-sm text-kalen-text-muted font-medium">
                        Light
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-kalen-surface-2 border border-kalen-border text-sm text-kalen-text-muted font-medium">
                        System
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-kalen-text-secondary mb-2">
                      Accent Color
                    </label>
                    <div className="flex gap-2">
                      {[
                        { color: "bg-blue-500", label: "Blue" },
                        { color: "bg-purple-500", label: "Purple" },
                        { color: "bg-amber-500", label: "Amber" },
                        { color: "bg-emerald-500", label: "Emerald" },
                        { color: "bg-rose-500", label: "Rose" },
                      ].map((c) => (
                        <button
                          key={c.label}
                          className={`w-8 h-8 rounded-full ${c.color} border-2 border-transparent hover:border-white/50 transition-colors`}
                          title={c.label}
                          aria-label={`Set accent color to ${c.label}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
