/**
 * KALEN Challenge Store
 * Redis-backed challenge storage with TTL for WebAuthn flows.
 */

import { REDIS_CHALLENGE_PREFIX } from "@kalen/shared";

/** Redis client interface — decoupled from specific Redis library */
export interface RedisClient {
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
}

/**
 * Redis-backed challenge store for WebAuthn registration and authentication flows.
 * Challenges auto-expire after a configurable TTL (default: 120 seconds).
 */
export class ChallengeStore {
  private readonly prefix: string;
  private readonly redis: RedisClient;

  constructor(redis: RedisClient, prefix: string = REDIS_CHALLENGE_PREFIX) {
    this.prefix = prefix;
    this.redis = redis;
  }

  private key(id: string): string {
    return `${this.prefix}${id}`;
  }

  /**
   * Store a challenge with a TTL.
   *
   * @param id - Unique identifier (e.g., userId or composite key)
   * @param challenge - The base64url-encoded challenge string
   * @param ttlSeconds - Time-to-live in seconds
   */
  async setChallenge(id: string, challenge: string, ttlSeconds: number): Promise<void> {
    const key = this.key(id);
    await this.redis.set(key, challenge, "EX", ttlSeconds);
  }

  /**
   * Retrieve a stored challenge.
   *
   * @param id - Unique identifier used when storing
   * @returns The challenge string, or null if expired/missing
   */
  async getChallenge(id: string): Promise<string | null> {
    const key = this.key(id);
    const result = await this.redis.get(key);
    return result;
  }

  /**
   * Delete a challenge after it has been consumed.
   * Prevents replay attacks by ensuring one-time use.
   *
   * @param id - Unique identifier used when storing
   */
  async deleteChallenge(id: string): Promise<void> {
    const key = this.key(id);
    await this.redis.del(key);
  }
}
