/**
 * KALEN Server — Auth Service
 * Handles WebAuthn registration/authentication, agent auth, and JWT token management.
 * Uses @kalen/identity for WebAuthn ceremonies, JWT issuance, Ed25519 verification, and RBAC.
 * Uses UserRepository and AgentRepository for database access.
 */

import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../database/repositories/user.repository';
import { AgentRepository } from '../database/repositories/agent.repository';
import { UserStatus, UserRole } from '../database/entities';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  issueHumanAccessToken,
  issueHumanRefreshToken,
  issueAgentAccessToken,
  issueAgentRefreshToken,
  verifyToken,
  refreshTokens,
  Ed25519Signer,
  type WebAuthnConfig,
  type AuthenticationConfig,
  type StoredCredential,
} from '@kalen/identity';
import { validateEmail } from '@kalen/shared';

/**
 * In-memory challenge store for development.
 * Implements the RedisClient interface from @kalen/identity ChallengeStore.
 * TODO: Wire to real Redis-backed implementation for production.
 */
class InMemoryChallengeStore {
  private store = new Map<string, { challenge: string; expiresAt: number }>();

  async set(key: string, challenge: string, ttlSeconds: number): Promise<unknown> {
    this.store.set(key, {
      challenge,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.challenge;
  }

  async del(key: string): Promise<number> {
    this.store.delete(key);
    return 1;
  }
}

@Injectable()
export class AuthService {
  private webauthnConfig: WebAuthnConfig;
  private authConfig: AuthenticationConfig;
  private challengeStore: InMemoryChallengeStore;

  constructor(
    private configService: ConfigService,
    private userRepo: UserRepository,
    private agentRepo: AgentRepository,
  ) {
    this.challengeStore = new InMemoryChallengeStore();
    // Cast to any to satisfy the RedisClient interface — in-memory compatible
    const challengeStoreAny = this.challengeStore as any;

    this.webauthnConfig = {
      rpName: configService.get<string>('webauthn.rpName', 'KALEN')!,
      rpID: configService.get<string>('webauthn.rpID', 'localhost')!,
      origin: configService.get<string>('webauthn.origin', 'http://localhost:3000')!,
      challengeStore: challengeStoreAny,
    };

    this.authConfig = {
      rpID: configService.get<string>('webauthn.rpID', 'localhost')!,
      origin: configService.get<string>('webauthn.origin', 'http://localhost:3000')!,
      challengeStore: challengeStoreAny,
    };
  }

  /**
   * Initiate WebAuthn registration.
   * Generates a challenge and returns registration options.
   */
  async registerBegin(email: string, displayName: string) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: emailValidation.error,
      });
    }

    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new ConflictException({
        error: 'CONFLICT',
        message: 'A user with this email already exists',
      });
    }

    const userId = crypto.randomUUID();
    const options = await generateRegistrationOptions(
      this.webauthnConfig,
      userId,
      email,
      displayName,
      [],
    );

    // Store userId → email mapping for register-finish
    await this.challengeStore.set(`register:${userId}`, email, 120);

    return { userId, options };
  }

  /**
   * Complete WebAuthn registration.
   * Verifies the attestation and creates the user in the database.
   */
  async registerFinish(email: string, attestationResponse: any) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new ConflictException({
        error: 'CONFLICT',
        message: 'User already exists',
      });
    }

    // Find the pending registration by looking up the user ID from challenge
    // The userId was returned in registerBegin and must be sent back
    const userId = attestationResponse.userId ?? crypto.randomUUID();

    const result = await verifyRegistrationResponse(
      this.webauthnConfig,
      userId,
      attestationResponse,
    );

    if (!result.verified) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'error' in result ? result.error : 'Registration verification failed',
      });
    }

    const suffix = this.generateSuffix('human', email.split('@')[0]);
    const credential = result.credential;

    const user = await this.userRepo.create({
      id: userId,
      username: email.split('@')[0],
      displayName: email.split('@')[0],
      email,
      suffix,
      credentials: [credential],
      role: UserRole.HUMAN_USER,
      status: UserStatus.ACTIVE,
    });

    return {
      identityId: user.id,
      suffix,
      entityType: 'human',
      // TODO: Wire to real BIP39 recovery phrase generation
      recoveryPhrase: null,
    };
  }

  /**
   * Initiate WebAuthn authentication.
   * Returns a challenge for the user's registered credentials.
   */
  async loginBegin(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'No account found with this email',
      });
    }

    const existingCredentials: StoredCredential[] = user.credentials.map((cred) => ({
      id: cred.id,
      publicKey: cred.publicKey,
      counter: cred.counter,
      transports: cred.transports as any,
    }));

    const { options, challengeKey } = await generateAuthenticationOptions(
      this.authConfig,
      existingCredentials,
    );

    // Store challengeKey with user ID for later lookup
    await this.challengeStore.set(`userForChallenge:${options.challenge}`, user.id, 120);

    return { options, challengeKey };
  }

  /**
   * Complete WebAuthn authentication.
   * Verifies the assertion and issues JWT tokens.
   */
  async loginFinish(email: string, assertionResponse: any) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }

    if (user.credentials.length === 0) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'No credentials registered',
      });
    }

    // Find the matching credential from the assertion response
    const credential = user.credentials.find(
      (c) => c.id === assertionResponse.id,
    ) as StoredCredential | undefined;

    if (!credential) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Credential not found',
      });
    }

    // The challenge key was returned by loginBegin and must be sent back by client
    const challengeKey = assertionResponse.challengeKey ?? `auth:${assertionResponse.response?.clientDataJSON}`;

    const result = await verifyAuthenticationResponse(
      this.authConfig,
      challengeKey,
      assertionResponse,
      {
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports as any,
      },
    );

    if (!result.verified) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'error' in result ? result.error : 'Authentication verification failed',
      });
    }

    // Update credential counter
    const credIndex = user.credentials.findIndex((c) => c.id === credential.id);
    if (credIndex >= 0) {
      user.credentials[credIndex].counter = result.newCounter;
    }

    await this.userRepo.update(user.id, {
      credentials: user.credentials,
      lastAuthAt: new Date(),
    });

    const jwtSecret = this.configService.get<string>('jwt.secret')!;
    const accessToken = await issueHumanAccessToken(user.id, jwtSecret);
    const refreshToken = await issueHumanRefreshToken(user.id, jwtSecret);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      identity: {
        id: user.id,
        suffix: user.suffix,
        entityType: 'human',
        displayName: user.displayName,
        roles: [user.role],
      },
    };
  }

  /**
   * Refresh tokens.
   */
  async refresh(refreshTokenValue: string) {
    const jwtSecret = this.configService.get<string>('jwt.secret')!;
    const result = await refreshTokens(refreshTokenValue, jwtSecret);

    if (!result) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
      });
    }

    const payload = await verifyToken(refreshTokenValue, jwtSecret);

    let identity = null;
    if (payload) {
      if (payload.kind === 'human') {
        const user = await this.userRepo.findById(payload.sub);
        if (user) {
          identity = {
            id: user.id,
            suffix: user.suffix,
            entityType: 'human' as const,
            displayName: user.displayName,
            roles: [user.role],
          };
        }
      } else {
        const agent = await this.agentRepo.findById(payload.sub);
        if (agent) {
          identity = {
            id: agent.id,
            suffix: agent.suffix,
            entityType: 'agent' as const,
            displayName: agent.displayName,
            roles: [agent.role],
          };
        }
      }
    }

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: payload?.kind === 'agent' ? 86400 : 900,
      tokenType: 'Bearer',
      identity,
    };
  }

  /**
   * Verify a JWT token and return identity info.
   */
  async verifyAccessToken(token: string) {
    const jwtSecret = this.configService.get<string>('jwt.secret')!;
    const payload = await verifyToken(token, jwtSecret);

    if (!payload || payload.tokenType !== 'access') {
      return { valid: false, identity: null };
    }

    let identity = null;
    if (payload.kind === 'human') {
      const user = await this.userRepo.findById(payload.sub);
      if (user) {
        identity = {
          id: user.id,
          suffix: user.suffix,
          entityType: user.kind,
          displayName: user.displayName,
          roles: [user.role],
        };
      }
    } else {
      const agent = await this.agentRepo.findById(payload.sub);
      if (agent) {
        identity = {
          id: agent.id,
          suffix: agent.suffix,
          entityType: 'agent',
          displayName: agent.displayName,
          roles: [agent.role],
        };
      }
    }

    return {
      valid: true,
      identity: identity ?? {
        id: payload.sub,
        entityType: payload.kind,
      },
    };
  }

  /**
   * Authenticate as an agent using Ed25519 signature.
   *
   * The signature is computed over `identityId + timestamp` using the agent's
   * Ed25519 private key. The server verifies the signature against the agent's
   * registered public key and checks that the timestamp is within ±30 seconds.
   */
  async authenticateAgent(identityId: string, timestamp: string, signature: string) {
    // Check timestamp freshness (±30 seconds)
    const now = Date.now();
    const ts = new Date(timestamp).getTime();
    if (isNaN(ts) || Math.abs(now - ts) > 30_000) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Timestamp is outside the acceptable range (±30 seconds)',
      });
    }

    // Look up the agent from the database
    const agent = await this.agentRepo.findById(identityId);
    if (!agent) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Agent not found',
      });
    }

    if (agent.status !== 'active') {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: `Agent is ${agent.status}`,
      });
    }

    // Verify Ed25519 signature: sign(identityId + timestamp)
    const message = `${identityId}${timestamp}`;
    const signatureValid = Ed25519Signer.verify(message, signature, agent.publicKey);

    if (!signatureValid) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Invalid Ed25519 signature',
      });
    }

    // Update agent's last active timestamp
    await this.agentRepo.update(agent.id, {
      lastActiveAt: new Date(),
      lastSeenAt: new Date(),
    });

    // Issue JWT tokens for the agent
    const jwtSecret = this.configService.get<string>('jwt.secret')!;
    const accessToken = await issueAgentAccessToken(identityId, agent.scopes, jwtSecret);
    const refreshToken = await issueAgentRefreshToken(identityId, agent.scopes, jwtSecret);

    return {
      accessToken,
      refreshToken,
      expiresIn: 86400,
      tokenType: 'Bearer',
      identity: {
        id: agent.id,
        suffix: agent.suffix,
        entityType: 'agent',
        displayName: agent.displayName,
        roles: [agent.role],
        scope: agent.scopes,
      },
    };
  }

  /**
   * Generate a KALEN suffix.
   */
  private generateSuffix(kind: 'human' | 'agent', name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
    const hex = crypto.randomUUID().slice(0, 4);
    const infix = kind === 'agent' ? '.agent' : '';
    return `@${base}${infix}#${hex}`;
  }
}
