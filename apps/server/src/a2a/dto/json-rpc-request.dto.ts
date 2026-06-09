/**
 * KALEN Server — JSON-RPC Request DTO
 * Request body for the A2A JSON-RPC endpoint.
 */

import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JsonRpcRequestDto {
  @ApiProperty({ description: 'JSON-RPC version', example: '2.0' })
  @IsString()
  jsonrpc: string;

  @ApiProperty({ description: 'A2A method name', example: 'tasks/send' })
  @IsString()
  method: string;

  @ApiPropertyOptional({ description: 'Method parameters' })
  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Request ID for correlation' })
  @IsOptional()
  id?: number | string;
}
