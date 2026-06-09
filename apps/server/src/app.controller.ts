/**
 * KALEN Server — Root Controller
 * Provides the root API info endpoint.
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('API Info')
@Controller()
export class AppController {
  /**
   * GET /api/v1
   * Returns basic API information.
   */
  @Get()
  @ApiOperation({ summary: 'Get API information' })
  getInfo() {
    return {
      name: 'KALEN API',
      version: '0.1.0',
      description: 'Kinetic Autonomous Layer for Entity Networking',
      apiVersion: 'v1',
      docs: '/api/v1/docs',
      protocols: {
        auth: ['WebAuthn (passkey)', 'Ed25519 (agent signature)'],
        messaging: ['REST', 'WebSocket (Socket.IO)'],
        tools: ['MCP (Model Context Protocol)'],
        agents: ['A2A (Agent-to-Agent Protocol)'],
      },
    };
  }
}
