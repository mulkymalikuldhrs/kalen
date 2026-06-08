/**
 * KALEN Agent Card Service
 * Register, update, retrieve, and validate Agent Cards.
 * Serve .well-known/agent.json endpoint data.
 */

import type { AgentCard, AgentCapabilities } from "@kalen/shared";
import { AGENT_SUFFIX, A2A_WELL_KNOWN_PATH } from "@kalen/shared";
import { validateAgentName } from "@kalen/shared";
import { signAgentCard, verifyAgentCardSignature } from "../security/card-signer";

/** Agent Card storage entry */
interface CardEntry {
  card: AgentCard;
  registeredAt: string;
  updatedAt: string;
  verified: boolean;
}

/**
 * Agent Card Service — manages the lifecycle of Agent Cards.
 *
 * Responsibilities:
 * - Register new Agent Cards with validation
 * - Update existing cards with re-signing
 * - Retrieve cards by URL or name
 * - Validate card signatures and format
 * - Serve .well-known/agent.json data
 */
export class AgentCardService {
  private cards: Map<string, CardEntry> = new Map(); // keyed by URL
  private nameIndex: Map<string, string> = new Map(); // name → url

  /**
   * Register a new Agent Card.
   * Validates the card format, name suffix, and optional signature.
   *
   * @param card - The Agent Card to register
   * @returns The registered card with metadata
   */
  async registerCard(card: AgentCard): Promise<AgentCard> {
    const validation = this.validateAgentCard(card);
    if (!validation.valid) {
      throw new Error(`Invalid Agent Card: ${validation.error}`);
    }

    if (this.cards.has(card.url)) {
      throw new Error(`Agent Card with URL "${card.url}" is already registered`);
    }

    if (this.nameIndex.has(card.name)) {
      throw new Error(`Agent with name "${card.name}" is already registered`);
    }

    const now = new Date().toISOString();
    this.cards.set(card.url, {
      card,
      registeredAt: now,
      updatedAt: now,
      verified: !!card.signature,
    });

    this.nameIndex.set(card.name, card.url);

    return card;
  }

  /**
   * Update an existing Agent Card.
   *
   * @param url - The card's URL (identifier)
   * @param updates - Partial card updates
   * @param signerPrivateKey - Private key to re-sign the card
   * @returns The updated card
   */
  async updateCard(
    url: string,
    updates: Partial<AgentCard>,
    signerPrivateKey?: string,
  ): Promise<AgentCard> {
    const entry = this.cards.get(url);
    if (!entry) {
      throw new Error(`Agent Card with URL "${url}" not found`);
    }

    const updatedCard: AgentCard = {
      ...entry.card,
      ...updates,
      url, // URL cannot be changed
    };

    // Re-validate
    const validation = this.validateAgentCard(updatedCard);
    if (!validation.valid) {
      throw new Error(`Updated card is invalid: ${validation.error}`);
    }

    // Re-sign if private key provided
    if (signerPrivateKey) {
      const signature = signAgentCard(updatedCard, signerPrivateKey);
      updatedCard.signature = signature;
      updatedCard.publicKey = entry.card.publicKey;
    }

    entry.card = updatedCard;
    entry.updatedAt = new Date().toISOString();

    return updatedCard;
  }

  /**
   * Retrieve an Agent Card by URL.
   */
  getCardByUrl(url: string): AgentCard | null {
    const entry = this.cards.get(url);
    return entry?.card ?? null;
  }

  /**
   * Retrieve an Agent Card by name.
   */
  getCardByName(name: string): AgentCard | null {
    const url = this.nameIndex.get(name);
    if (!url) return null;
    return this.getCardByUrl(url);
  }

  /**
   * List all registered Agent Cards.
   */
  listCards(): AgentCard[] {
    return Array.from(this.cards.values()).map((entry) => entry.card);
  }

  /**
   * Unregister an Agent Card.
   */
  unregisterCard(url: string): boolean {
    const entry = this.cards.get(url);
    if (!entry) return false;

    this.nameIndex.delete(entry.card.name);
    this.cards.delete(url);
    return true;
  }

  /**
   * Validate an Agent Card's format and signature.
   *
   * @param card - The card to validate
   * @returns Validation result
   */
  validateAgentCard(card: AgentCard): { valid: boolean; error?: string } {
    if (!card.name || typeof card.name !== "string") {
      return { valid: false, error: "Card must have a name" };
    }

    if (!card.name.endsWith(AGENT_SUFFIX)) {
      return { valid: false, error: `Agent Card name must end with "${AGENT_SUFFIX}"` };
    }

    if (!card.url || typeof card.url !== "string") {
      return { valid: false, error: "Card must have a URL" };
    }

    try {
      new URL(card.url);
    } catch {
      return { valid: false, error: "Card URL must be a valid URL" };
    }

    if (!card.capabilities || typeof card.capabilities !== "object") {
      return { valid: false, error: "Card must have capabilities" };
    }

    if (!Array.isArray(card.endpoints)) {
      return { valid: false, error: "Card must have an endpoints array" };
    }

    if (!card.authentication || typeof card.authentication !== "object") {
      return { valid: false, error: "Card must have authentication configuration" };
    }

    const validSchemes = ["none", "bearer", "oauth2", "mtls"];
    if (!validSchemes.includes(card.authentication.scheme)) {
      return { valid: false, error: `Invalid authentication scheme: ${card.authentication.scheme}` };
    }

    // Verify signature if present
    if (card.signature && card.publicKey) {
      const sigValid = verifyAgentCardSignature(card);
      if (!sigValid) {
        return { valid: false, error: "Card signature verification failed" };
      }
    }

    return { valid: true };
  }

  /**
   * Fetch and cache an Agent Card from a remote URL.
   *
   * @param agentUrl - URL to fetch the card from
   * @param cacheTTL - Cache time-to-live in seconds
   * @returns The fetched and cached card
   */
  async fetchAndCacheCard(agentUrl: string, cacheTTL: number): Promise<AgentCard> {
    // Check cache first
    const cached = this.getCardByUrl(agentUrl);
    if (cached) {
      const entry = this.cards.get(agentUrl);
      if (entry) {
        const age = (Date.now() - new Date(entry.updatedAt).getTime()) / 1000;
        if (age < cacheTTL) {
          return cached;
        }
      }
    }

    // Fetch from remote .well-known endpoint
    const wellKnownUrl = this.buildWellKnownUrl(agentUrl);

    const response = await fetch(wellKnownUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Agent Card from ${wellKnownUrl}: HTTP ${response.status}`);
    }

    const card = (await response.json()) as AgentCard;

    // Validate the fetched card
    const validation = this.validateAgentCard(card);
    if (!validation.valid) {
      throw new Error(`Fetched card is invalid: ${validation.error}`);
    }

    // Cache it
    const now = new Date().toISOString();
    this.cards.set(agentUrl, {
      card,
      registeredAt: now,
      updatedAt: now,
      verified: !!card.signature,
    });
    this.nameIndex.set(card.name, card.url);

    return card;
  }

  /**
   * Serve the .well-known/agent.json data for a given base URL.
   *
   * @param baseUrl - The agent's base URL
   * @returns The Agent Card JSON object, or null if not found
   */
  serveWellKnown(baseUrl: string): AgentCard | null {
    return this.getCardByUrl(baseUrl);
  }

  /**
   * Build the .well-known URL for agent card discovery.
   */
  private buildWellKnownUrl(agentUrl: string): string {
    try {
      const url = new URL(agentUrl);
      return `${url.origin}${A2A_WELL_KNOWN_PATH}`;
    } catch {
      return `${agentUrl}${A2A_WELL_KNOWN_PATH}`;
    }
  }
}
