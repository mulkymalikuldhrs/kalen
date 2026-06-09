/**
 * KALEN Server — Register Finish DTO
 * Completes WebAuthn registration with attestation response.
 */

import { IsEmail, IsObject, IsString } from 'class-validator';

export class RegisterFinishDto {
  @IsEmail()
  email: string;

  @IsObject()
  attestationResponse: Record<string, string>;
}
