import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    const { token, teamId } = client.handshake.auth as {
      token?: string;
      teamId?: string;
    };

    // Agent connecté avec JWT
    if (token) {
      try {
        const payload: any = jwt.verify(
          token,
          process.env.JWT_SECRET || 'dev-secret-change-me',
        );
        client.data.userId = payload.sub;
        client.data.teamId = payload.teamId;
      } catch (e) {
        console.error('Invalid JWT on socket', e);
        client.disconnect();
        return;
      }
    } else if (teamId) {
      // Widget : pour l’instant on accepte un teamId passé en auth (clé publique plus tard)
      client.data.teamId = teamId;
    } else {
      console.warn('Socket without teamId or token');
      client.disconnect();
      return;
    }
  }

  handleDisconnect(client: Socket) {
    // logs éventuels
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.join(roomId);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody()
    payload: { roomId: string; content: string; sender: string },
    @ConnectedSocket() client: Socket,
  ) {
    const teamId = client.data.teamId as string | undefined;
    if (!teamId) {
      console.warn('send_message without teamId');
      return;
    }

    const message = await this.messagesService.create(
      {
        roomId: payload.roomId,
        content: payload.content,
        sender: payload.sender,
      },
      teamId,
    );

    this.server.to(payload.roomId).emit('new_message', message);
  }
}