/**
 * KALEN Server — Messaging Module
 * Rooms, messages, presence, and typing indicators.
 * Uses RoomRepository and MessageRepository for database access.
 * TODO: Wire to OpenIM for real message delivery.
 */

import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { MessageController } from './message.controller';
import { RoomService } from './room.service';
import { MessageService } from './message.service';
import { RoomRepository } from '../database/repositories/room.repository';
import { MessageRepository } from '../database/repositories/message.repository';

@Module({
  imports: [],
  controllers: [RoomController, MessageController],
  providers: [RoomService, MessageService, RoomRepository, MessageRepository],
  exports: [RoomService, MessageService],
})
export class MessagingModule {}
