/**
 * KALEN Server — Message Controller
 * Message operations within rooms.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { SendMessageDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@kalen/identity';

@ApiTags('Messages')
@ApiBearerAuth('bearer')
@Controller('rooms')
@UseGuards(JwtAuthGuard, RbacGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * POST /api/v1/rooms/:roomId/messages
   * Send a message to a room.
   */
  @Post(':roomId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message to a room' })
  @RequirePermissions(Permission.MESSAGE_SEND)
  async sendMessage(
    @Param('roomId') roomId: string,
    @Body() dto: SendMessageDto,
    @Request() req: any,
  ) {
    return this.messageService.sendMessage(
      roomId,
      req.identity.sub,
      req.identity.kind,
      req.identity.suffix ?? null,
      dto,
    );
  }

  /**
   * GET /api/v1/rooms/:roomId/messages
   * List messages in a room.
   */
  @Get(':roomId/messages')
  @ApiOperation({ summary: 'List messages in a room' })
  @RequirePermissions(Permission.MESSAGE_READ)
  async listMessages(
    @Param('roomId') roomId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @Request() req?: any,
  ) {
    return this.messageService.listMessages(roomId, req.identity.sub, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      before,
    });
  }
}
