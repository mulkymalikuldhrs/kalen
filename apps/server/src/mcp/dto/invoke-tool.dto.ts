/**
 * KALEN Server — Invoke Tool DTO
 * Request body for POST /api/v1/mcp/invoke
 */

import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvokeToolDto {
  @ApiProperty({ description: 'Tool identifier (e.g., "github.create_issue")' })
  @IsString()
  toolId: string;

  @ApiProperty({ description: 'Tool input arguments' })
  @IsObject()
  input: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Client-provided request ID for idempotency' })
  @IsOptional()
  @IsString()
  requestId?: string;
}
