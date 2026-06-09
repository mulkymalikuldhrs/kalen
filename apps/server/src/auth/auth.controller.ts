/**
 * KALEN Server — Auth Controller
 * WebAuthn registration/authentication, agent auth, token refresh, and verification.
 * Routes match the API.md specification.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterBeginDto,
  RegisterFinishDto,
  LoginBeginDto,
  LoginFinishDto,
  RefreshDto,
  AgentAuthDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register-begin
   * Initiate WebAuthn registration.
   */
  @Post('register-begin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate WebAuthn passkey registration' })
  async registerBegin(@Body() dto: RegisterBeginDto) {
    return this.authService.registerBegin(dto.email, dto.displayName);
  }

  /**
   * POST /api/v1/auth/register-finish
   * Complete WebAuthn registration.
   */
  @Post('register-finish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete WebAuthn passkey registration' })
  async registerFinish(@Body() dto: RegisterFinishDto) {
    return this.authService.registerFinish(dto.email, dto.attestationResponse);
  }

  /**
   * POST /api/v1/auth/login-begin
   * Initiate WebAuthn authentication.
   */
  @Post('login-begin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate WebAuthn passkey login' })
  async loginBegin(@Body() dto: LoginBeginDto) {
    return this.authService.loginBegin(dto.email);
  }

  /**
   * POST /api/v1/auth/login-finish
   * Complete WebAuthn authentication.
   */
  @Post('login-finish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete WebAuthn passkey login' })
  async loginFinish(@Body() dto: LoginFinishDto) {
    return this.authService.loginFinish(dto.email, dto.assertionResponse);
  }

  /**
   * POST /api/v1/auth/refresh
   * Exchange a valid refresh token for new tokens.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * POST /api/v1/auth/agent
   * Authenticate as an agent using Ed25519 signature.
   */
  @Post('agent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate as an agent using Ed25519 signature' })
  async agentAuth(@Body() dto: AgentAuthDto) {
    return this.authService.authenticateAgent(dto.identityId, dto.timestamp, dto.signature);
  }

  /**
   * GET /api/v1/auth/verify
   * Verify the current JWT token.
   */
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Verify the current JWT token' })
  async verify(@Headers('authorization') authHeader: string) {
    const token = authHeader.replace('Bearer ', '');
    return this.authService.verifyAccessToken(token);
  }
}
