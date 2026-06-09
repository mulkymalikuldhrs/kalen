/**
 * KALEN Server — Create Agent DTO
 * Create a new agent with Ed25519 keypair.
 */

import { IsString, IsOptional, IsObject, ValidateNested, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class CapabilitiesDto {
  @IsOptional()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString({ each: true })
  tools?: string[];

  @IsOptional()
  @IsObject()
  rateLimits?: Record<string, number>;
}

export class CreateAgentDto {
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  displayName: string;

  @IsString()
  publicKey: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CapabilitiesDto)
  capabilities?: CapabilitiesDto;
}
