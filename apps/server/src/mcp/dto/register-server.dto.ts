/**
 * KALEN Server — Register Server DTO
 * Request body for POST /api/v1/mcp/servers
 */

import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterServerDto {
  @ApiProperty({ description: 'Unique server identifier' })
  @IsString()
  serverId: string;

  @ApiProperty({ description: 'Server name' })
  @IsString()
  serverName: string;

  @ApiProperty({ description: 'Transport type' })
  @IsEnum(['stdio', 'sse', 'websocket'])
  transport: 'stdio' | 'sse' | 'websocket';

  @ApiProperty({ description: 'Connection endpoint URL' })
  @IsString()
  endpoint: string;

  @ApiPropertyOptional({ description: 'Server API key or token' })
  @IsOptional()
  @IsString()
  apiKey?: string;
}
