// src/sockets/socketServer_front.ts
import { Server } from 'socket.io';

export const initSocketServer = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          process.env.CORS_ORIGIN,
          'http://localhost:5173',
          'http://localhost:3000'
        ];

        const isVercelPreview = origin.endsWith('.vercel.app');

        if (allowedOrigins.includes(origin) || isVercelPreview) {
          callback(null, true);
        } else {
          callback(new Error(`WebSocket CORS bloqueado para: ${origin}`));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`📡 Cliente conectado vía WebSocket: ${socket.id}`);   
  });

  return io;
};