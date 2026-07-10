// src/sockets/socketServer_front.ts
import { Server } from 'socket.io';



export const initSocketServer = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Puerto de tu Vite frontend
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`📡 Cliente conectado: ${socket.id}`);   
  });
  
};