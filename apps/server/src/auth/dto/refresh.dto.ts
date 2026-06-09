/**
 * KALEN Server — Refresh Token DTO
 */

import { IsString } from 'class-validator';

export class RefreshDto {
  @IsString()
  refreshToken: string;
}
