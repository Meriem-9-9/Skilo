import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class SessionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SessionsGateway.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinSession')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; token: string },
  ) {
    try {
      if (!payload.token || !payload.sessionId) return;
      
      const user = await this.jwtService.verifyAsync(payload.token);
      
      // Verify user is part of the session
      const session = await this.prisma.session.findUnique({
        where: { id: payload.sessionId },
      });
      
      if (!session) return;
      
      if (session.proposedById !== user.sub && session.recipientId !== user.sub) {
        return;
      }
      
      client.join(`session_${payload.sessionId}`);
      this.logger.log(`User ${user.sub} a rejoint la session session_${payload.sessionId}`);
    } catch (err) {
      this.logger.error('erreur lors de la connexion a la session', err);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { 
      sessionId: string; 
      token: string; 
      content?: string; 
      imageUrl?: string; 
      isMeetingLinkSuggestion?: boolean 
    },
  ) {
    try {
      const user = await this.jwtService.verifyAsync(payload.token);

      const session = await this.prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session || !['pending', 'confirmed'].includes(session.status)) {
        return;
      }

      if (session.proposedById !== user.sub && session.recipientId !== user.sub) {
        return;
      }

      const message = await this.prisma.message.create({
        data: {
          sessionId: payload.sessionId,
          senderId: user.sub,
          content: payload.content,
          imageUrl: payload.imageUrl,
          isMeetingLinkSuggestion: payload.isMeetingLinkSuggestion ?? false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // on envoie le message a tout le monde dans la salle
      this.server.to(`session_${payload.sessionId}`).emit('newMessage', message);
    } catch (err) {
      this.logger.error('erreur lors de l\'envoi du message', err);
    }
  }
}
