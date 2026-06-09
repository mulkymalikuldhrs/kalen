/**
 * KALEN Server — Agent Auth DTO
 * Agent authentication using Ed25519 signature.
 */

import { IsString, IsISO8601 } from 'class-validator';

export class AgentAuthDto {
  @IsString()
  identityId: string;

  @IsISO8601()
  timestamp: string;

  @IsString()
  signature: string;
}
