/**
 * KALEN Server — Create Room DTO
 */

import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class MemberDto {
  @IsUUID()
  id: string;

  @IsEnum(['human', 'agent'])
  kind: 'human' | 'agent';
}

export class CreateRoomDto {
  @IsEnum(['direct', 'team', 'agent_war_room', 'broadcast'])
  type: 'direct' | 'team' | 'agent_war_room' | 'broadcast';

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberDto)
  members: MemberDto[];

  @IsOptional()
  @IsEnum(['public', 'private', 'agent_only', 'hybrid'])
  visibility?: 'public' | 'private' | 'agent_only' | 'hybrid';
}
