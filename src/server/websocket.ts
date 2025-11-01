// WebSocket Server - Socket.io real-time updates for frontend
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { EventBus } from '../core/events/EventBus';
import { SystemEvents } from '../types';

export function setupWebSocket(server: HTTPServer, eventBus: EventBus): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });
  
  // Subscribe to all system events and broadcast to clients
  const eventTypes = Object.values(SystemEvents);
  
  for (const eventType of eventTypes) {
    eventBus.subscribe(eventType, (payload) => {
      // Broadcast event to all connected clients
      io.emit('event', {
        type: eventType,
        data: payload.data,
        timestamp: payload.timestamp
      });
    });
  }
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send current system status
    socket.emit('connected', {
      message: 'Connected to AutoBazaaar',
      timestamp: Date.now()
    });
    
    // Subscribe to specific events
    socket.on('subscribe', (eventTypes: string[]) => {
      eventTypes.forEach(eventType => {
        eventBus.subscribe(eventType as SystemEvents, (payload) => {
          socket.emit('event', {
            type: eventType,
            data: payload.data,
            timestamp: payload.timestamp
          });
        });
      });
    });
    
    // Unsubscribe from events
    socket.on('unsubscribe', (eventTypes: string[]) => {
      // Handle unsubscribe if needed
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  return io;
}

