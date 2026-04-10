import { Injectable, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/events',
})
@Injectable()
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('WebSocket gateway initialized on namespace /events');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  /** Client subscribes to a room (e.g. "shipment:uuid" or "load:uuid") */
  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
    void client.join(room);
    this.logger.debug(`${client.id} joined room: ${room}`);
  }

  /** Client leaves a room */
  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
    void client.leave(room);
  }

  /** Emit shipment.updated to all clients watching a specific shipment room */
  emitShipmentUpdated(shipmentId: string, payload: Record<string, unknown>) {
    this.server.to(`shipment:${shipmentId}`).emit('shipment.updated', payload);
  }

  /** Emit load.updated to all clients watching a load (e.g. new bid placed) */
  emitLoadUpdated(loadId: string, payload: Record<string, unknown>) {
    this.server.to(`load:${loadId}`).emit('load.updated', payload);
  }
}
