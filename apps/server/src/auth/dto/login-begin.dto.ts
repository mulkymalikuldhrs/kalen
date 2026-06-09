/**
 * KALEN Server — Login Begin DTO
 * Initiates WebAuthn authentication.
 */

import { IsEmail } from 'class-validator';

export class LoginBeginDto {
  @IsEmail()
  email: string;
}
