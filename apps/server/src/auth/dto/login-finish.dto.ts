/**
 * KALEN Server — Login Finish DTO
 * Completes WebAuthn authentication with assertion response.
 */

import { IsEmail, IsObject } from 'class-validator';

export class LoginFinishDto {
  @IsEmail()
  email: string;

  @IsObject()
  assertionResponse: Record<string, string>;
}
