/**
 * KALEN Validation Utilities
 * Input validation at function boundaries.
 */

import { AGENT_DISPLAY_SUFFIX, ED25519_PUBLIC_KEY_LENGTH, MAX_AGENT_NAME_LENGTH, MIN_AGENT_NAME_LENGTH } from "./constants";

/**
 * Validates that an agent name ends with the required "(ai)" suffix
 * and meets length and character requirements.
 *
 * @param name - The agent name to validate
 * @returns Validation result with success flag and error message
 */
export function validateAgentName(name: string): { valid: boolean; error?: string } {
  if (typeof name !== "string") {
    return { valid: false, error: "Agent name must be a string" };
  }

  const trimmed = name.trim();

  if (trimmed.length < MIN_AGENT_NAME_LENGTH) {
    return { valid: false, error: `Agent name must be at least ${MIN_AGENT_NAME_LENGTH} characters` };
  }

  if (trimmed.length > MAX_AGENT_NAME_LENGTH) {
    return { valid: false, error: `Agent name must be at most ${MAX_AGENT_NAME_LENGTH} characters` };
  }

  if (!trimmed.endsWith(AGENT_DISPLAY_SUFFIX)) {
    return { valid: false, error: `Agent name must end with "${AGENT_DISPLAY_SUFFIX}" suffix` };
  }

  const baseName = trimmed.slice(0, trimmed.length - AGENT_DISPLAY_SUFFIX.length).trimEnd();
  if (baseName.length === 0) {
    return { valid: false, error: "Agent name must have a non-empty name before the suffix" };
  }

  const validNamePattern = /^[a-zA-Z0-9_\-. ]+$/;
  if (!validNamePattern.test(baseName)) {
    return { valid: false, error: "Agent name can only contain alphanumeric characters, spaces, underscores, hyphens, and dots" };
  }

  return { valid: true };
}

/**
 * Validates an email address format.
 *
 * @param email - The email address to validate
 * @returns Validation result with success flag and error message
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (typeof email !== "string") {
    return { valid: false, error: "Email must be a string" };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { valid: false, error: "Email cannot be empty" };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: "Email cannot exceed 254 characters" };
  }

  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailPattern.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }

  const [localPart, domain] = trimmed.split("@");
  if (!localPart || localPart.length > 64) {
    return { valid: false, error: "Email local part cannot exceed 64 characters" };
  }

  if (!domain || !domain.includes(".")) {
    return { valid: false, error: "Email domain must contain a dot" };
  }

  return { valid: true };
}

/**
 * Validates an Ed25519 public key format.
 * Ed25519 public keys are 32 bytes, base64url-encoded to 43 characters.
 *
 * @param key - The base64url-encoded public key to validate
 * @returns Validation result with success flag and error message
 */
export function validatePublicKey(key: string): { valid: boolean; error?: string } {
  if (typeof key !== "string") {
    return { valid: false, error: "Public key must be a string" };
  }

  if (key.length === 0) {
    return { valid: false, error: "Public key cannot be empty" };
  }

  const base64urlPattern = /^[A-Za-z0-9_-]+$/;
  if (!base64urlPattern.test(key)) {
    return { valid: false, error: "Public key must be base64url-encoded (no padding)" };
  }

  const decodedLength = Math.floor((key.length * 3) / 4);
  if (decodedLength !== ED25519_PUBLIC_KEY_LENGTH) {
    return { valid: false, error: `Ed25519 public key must decode to ${ED25519_PUBLIC_KEY_LENGTH} bytes, got ${decodedLength}` };
  }

  return { valid: true };
}

/**
 * Validates a JSON Schema object for MCP tool input.
 * Checks that the schema is a valid JSON Schema draft-07 compatible object.
 *
 * @param schema - The schema to validate
 * @returns Validation result with success flag and error message
 */
export function validateMCPToolSchema(schema: unknown): { valid: boolean; error?: string } {
  if (schema === null || schema === undefined) {
    return { valid: false, error: "Schema cannot be null or undefined" };
  }

  if (typeof schema !== "object" || Array.isArray(schema)) {
    return { valid: false, error: "Schema must be a plain object" };
  }

  const obj = schema as Record<string, unknown>;

  if (obj.type !== "object") {
    return { valid: false, error: 'Schema top-level type must be "object"' };
  }

  if (obj.properties !== undefined) {
    if (typeof obj.properties !== "object" || obj.properties === null || Array.isArray(obj.properties)) {
      return { valid: false, error: '"properties" must be an object' };
    }

    for (const [key, value] of Object.entries(obj.properties)) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { valid: false, error: `Property "${key}" must be a valid schema object` };
      }
      const propSchema = value as Record<string, unknown>;
      if (typeof propSchema.type !== "string" && propSchema.anyOf === undefined && propSchema.oneOf === undefined && propSchema.allOf === undefined && propSchema.$ref === undefined) {
        return { valid: false, error: `Property "${key}" must have a "type", "anyOf", "oneOf", "allOf", or "$ref" field` };
      }
    }
  }

  if (obj.required !== undefined) {
    if (!Array.isArray(obj.required)) {
      return { valid: false, error: '"required" must be an array of strings' };
    }
    for (const item of obj.required) {
      if (typeof item !== "string") {
        return { valid: false, error: '"required" array must contain only strings' };
      }
    }
  }

  if (obj.additionalProperties !== undefined && typeof obj.additionalProperties !== "boolean" && typeof obj.additionalProperties !== "object") {
    return { valid: false, error: '"additionalProperties" must be a boolean or schema object' };
  }

  return { valid: true };
}
