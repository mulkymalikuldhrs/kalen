/**
 * KALEN Server — Register Begin DTO
 * Initiates WebAuthn registration.
 */

import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterBeginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  displayName: string;
}
