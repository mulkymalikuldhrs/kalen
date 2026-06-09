/**
 * KALEN Server — Send Message DTO
 */

import { IsString, IsOptional, IsEnum, IsArray, IsUUID, MaxLength } from 'class-validator';
import { MAX_MESSAGE_LENGTH } from '@kalen/shared';

export class SendMessageDto {
  @IsString()
  @MaxLength(MAX_MESSAGE_LENGTH)
  content: string;

  @IsOptional()
  @IsEnum(['text', 'markdown', 'code', 'json'])
  type?: 'text' | 'markdown' | 'code' | 'json';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @IsOptional()
  @IsUUID()
  replyTo?: string;
}
