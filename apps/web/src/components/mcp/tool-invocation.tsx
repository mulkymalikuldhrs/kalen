/**
 * MCP Tool Invocation UI
 * Interface for invoking MCP tools with parameter inputs and result display.
 */

"use client";

import React, { useState } from "react";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Code,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import type { MCPTool, MCPCallResult, ToolInvocationState } from "@/lib/types";

interface ToolInvocationProps {
  tool: MCPTool;
  serverId: string;
  serverName: string;
  onInvoke: (toolName: string, args: Record<string, unknown>) => Promise<MCPCallResult | null>;
}

export function ToolInvocation({ tool, serverId, serverName, onInvoke }: ToolInvocationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [args, setArgs] = useState<Record<string, unknown>>({});
  const [isInvoking, setIsInvoking] = useState(false);
  const [result, setResult] = useState<MCPCallResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInvoke = async () => {
    setIsInvoking(true);
    setError(null);
    setResult(null);

    try {
      const res = await onInvoke(tool.name, args);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tool invocation failed");
    } finally {
      setIsInvoking(false);
    }
  };

  const handleArgChange = (key: string, value: string) => {
    setArgs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="rounded-xl border border-kalen-border bg-kalen-surface overflow-hidden">
      {/* Tool header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-kalen-surface-2 transition-colors"
      >
        <Code size={16} className="text-kalen-accent flex-shrink-0" />
        <div className="flex-1 text-left">
          <span className="text-sm font-medium text-kalen-text">{tool.name}</span>
          <span className="text-xs text-kalen-text-muted ml-2">from {serverName}</span>
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-kalen-text-muted" />
        ) : (
          <ChevronRight size={16} className="text-kalen-text-muted" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-kalen-border p-4 space-y-4">
          {/* Description */}
          <p className="text-sm text-kalen-text-secondary">{tool.description}</p>

          {/* Input parameters */}
          {tool.inputSchema.properties && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-kalen-text-muted uppercase tracking-wider">
                Parameters
              </h4>
              {Object.entries(tool.inputSchema.properties).map(([key, schema]) => {
                const propSchema = schema as { type?: string; description?: string; enum?: string[] };
                const isRequired = tool.inputSchema.required?.includes(key);
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-kalen-text-secondary mb-1">
                      {key}
                      {isRequired && <span className="text-kalen-error ml-1">*</span>}
                    </label>
                    {propSchema.enum ? (
                      <select
                        value={(args[key] as string) || ""}
                        onChange={(e) => handleArgChange(key, e.target.value)}
                        className="w-full bg-kalen-bg border border-kalen-border rounded-lg px-3 py-2 text-sm text-kalen-text focus:outline-none focus:border-kalen-primary transition-colors"
                      >
                        <option value="">Select...</option>
                        {propSchema.enum.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={propSchema.type === "number" ? "number" : "text"}
                        value={(args[key] as string) || ""}
                        onChange={(e) => handleArgChange(key, e.target.value)}
                        placeholder={propSchema.description || key}
                        className="w-full bg-kalen-bg border border-kalen-border rounded-lg px-3 py-2 text-sm text-kalen-text placeholder:text-kalen-text-muted focus:outline-none focus:border-kalen-primary transition-colors"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Invoke button */}
          <button
            onClick={handleInvoke}
            disabled={isInvoking}
            className={clsx(
              "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
              isInvoking
                ? "bg-kalen-surface-3 text-kalen-text-muted cursor-not-allowed"
                : "bg-kalen-accent/10 text-kalen-accent hover:bg-kalen-accent/20 border border-kalen-accent/30"
            )}
          >
            {isInvoking ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Invoking...
              </>
            ) : (
              <>
                <Play size={16} />
                Invoke Tool
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div
              className={clsx(
                "rounded-lg p-3 border",
                result.isError
                  ? "bg-kalen-error/5 border-kalen-error/20"
                  : "bg-kalen-success/5 border-kalen-success/20"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.isError ? (
                  <XCircle size={14} className="text-kalen-error" />
                ) : (
                  <CheckCircle2 size={14} className="text-kalen-success" />
                )}
                <span className="text-xs font-semibold text-kalen-text">
                  {result.isError ? "Error" : "Success"}
                </span>
              </div>
              <pre className="text-xs text-kalen-text-secondary overflow-x-auto custom-scrollbar">
                {JSON.stringify(result.content, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-kalen-error/10 border border-kalen-error/20 text-kalen-error text-sm">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
