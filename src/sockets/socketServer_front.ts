// src/sockets/socketServer_front.ts
import { Server } from 'socket.io';

export const initSocketServer = (server: any) => {
  // Lista de orígenes permitidos para WebSockets
  const allowedOrigins = [
    process.env.CORS_ORIGIN, // https://ajedrez-frontend.vercel.app
    "http://localhost:5173",  // Vite local
    "http://localhost:3000"
  ];

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
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