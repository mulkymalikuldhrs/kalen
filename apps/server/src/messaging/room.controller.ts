/**
 * KALEN Server — Room Controller
 * Room/conversation CRUD operations.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@kalen/identity';

@ApiTags('Rooms')
@ApiBearerAuth('bearer')
@Controller('rooms')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * POST /api/v1/rooms
   * Create a room.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new room/conversation' })
  @RequirePermissions(Permission.ROOM_CREATE)
  async create(@Body() dto: CreateRoomDto, @Request() req: any) {
    return this.roomService.createRoom(req.identity.sub, req.identity.kind, dto);
  }

  /**
   * GET /api/v1/rooms
   * List rooms for the current user.
   */
  @Get()
  @ApiOperation({ summary: 'List rooms for the current identity' })
  @RequirePermissions(Permission.ROOM_READ)
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Request() req?: any,
  ) {
    return this.roomService.listRooms(req.identity.sub, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
    });
  }

  /**
   * GET /api/v1/rooms/:id
   * Get room details.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get room details by ID' })
  @RequirePermissions(Permission.ROOM_READ)
  async get(@Param('id') id: string, @Request() req: any) {
    return this.roomService.getRoom(id, req.identity.sub);
  }
}
