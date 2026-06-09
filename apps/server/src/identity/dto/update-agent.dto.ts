/**
 * KALEN Server — Update Agent DTO
 */

import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsObject()
  capabilities?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(['active', 'suspended', 'revoked'])
  status?: 'active' | 'suspended' | 'revoked';
}
