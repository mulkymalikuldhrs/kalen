/**
 * KALEN Server — A2A Message DTO
 * Message structure for A2A task creation and communication.
 */

import { IsString, IsEnum, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class A2aMessagePartDto {
  @ApiProperty({ description: 'Part type', enum: ['text', 'file', 'data'] })
  @IsEnum(['text', 'file', 'data'])
  type: 'text' | 'file' | 'data';

  @ApiPropertyOptional({ description: 'Text content for text parts' })
  @IsOptional()
  @IsString()
  text?: string;
}

export class A2aMessageDto {
  @ApiProperty({ description: 'Message role', enum: ['user', 'agent'] })
  @IsEnum(['user', 'agent'])
  role: 'user' | 'agent';

  @ApiProperty({ description: 'Message content parts', type: [A2aMessagePartDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => A2aMessagePartDto)
  parts: A2aMessagePartDto[];
}
