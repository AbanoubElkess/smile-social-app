import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

export const socketHandler = (io: SocketIOServer) => {
  // Middleware for socket authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          profile: true
        }
      });

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining conversation rooms
    socket.on('join_conversation', async (conversationId: string) => {
      try {
        // Verify user is part of this conversation
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            participants: {
              some: {
                userId: socket.userId
              }
            }
          }
        });

        if (conversation) {
          socket.join(`conversation:${conversationId}`);
          logger.info(`User ${socket.userId} joined conversation ${conversationId}`);
        } else {
          socket.emit('error', { message: 'Unauthorized to join this conversation' });
        }
      } catch (error) {
        logger.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data: {
      conversationId: string;
      content: string;
      type?: string;
    }) => {
      try {
        const { conversationId, content, type = 'text' } = data;

        // Verify user is part of this conversation
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            participants: {
              some: {
                userId: socket.userId
              }
            }
          },
          include: {
            participants: {
              include: {
                user: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found or unauthorized' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            content,
            type,
            senderId: socket.userId!,
            conversationId,
          },
          include: {
            sender: {
              include: {
                profile: true
              }
            }
          }
        });

        // Update conversation last message
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageAt: new Date(),
            lastMessageId: message.id
          }
        });

        // Emit message to all participants in the conversation
        io.to(`conversation:${conversationId}`).emit('new_message', {
          id: message.id,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
          sender: {
            id: message.sender.id,
            username: message.sender.username,
            profile: message.sender.profile
          }
        });

        // Send push notifications to offline users (if implemented)
        // This would be handled by a separate notification service

      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user?.username
      });
    });

    socket.on('typing_stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId
      });
    });

    // Handle user status updates
    socket.on('status_update', async (status: 'online' | 'away' | 'busy' | 'offline') => {
      try {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { status }
        });

        // Broadcast status to friends/followers
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          status
        });
      } catch (error) {
        logger.error('Error updating user status:', error);
      }
    });

    // Handle live reactions
    socket.on('live_reaction', (data: {
      postId: string;
      reaction: string;
    }) => {
      // Broadcast live reaction to users viewing the same post
      socket.broadcast.emit('live_reaction_received', {
        postId: data.postId,
        reaction: data.reaction,
        userId: socket.userId,
        username: socket.user?.username
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${socket.userId}`);
      
      try {
        // Update user status to offline
        await prisma.user.update({
          where: { id: socket.userId },
          data: { 
            status: 'offline',
            lastSeenAt: new Date()
          }
        });

        // Broadcast offline status
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          status: 'offline'
        });
      } catch (error) {
        logger.error('Error updating user status on disconnect:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });
};

// Helper functions for sending notifications
export const sendNotificationToUser = (io: SocketIOServer, userId: string, notification: any) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

export const sendNotificationToConversation = (io: SocketIOServer, conversationId: string, notification: any) => {
  io.to(`conversation:${conversationId}`).emit('notification', notification);
};

export const broadcastToAllUsers = (io: SocketIOServer, event: string, data: any) => {
  io.emit(event, data);
};
