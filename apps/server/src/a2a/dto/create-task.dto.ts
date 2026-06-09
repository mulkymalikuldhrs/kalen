/**
 * KALEN Server — Create A2A Task DTO
 * Request body for POST /api/v1/a2a/tasks
 */

import { IsString, IsOptional, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { A2aMessageDto } from './a2a-message.dto';

export class CreateA2aTaskDto {
  @ApiProperty({ description: 'Target agent ID for the task' })
  @IsString()
  agentId: string;

  @ApiPropertyOptional({ description: 'Creator kind override' })
  @IsOptional()
  @IsEnum(['human', 'agent'])
  creatorKind?: 'human' | 'agent';

  @ApiProperty({ description: 'Initial task message' })
  @ValidateNested()
  @Type(() => A2aMessageDto)
  message: A2aMessageDto;
}
