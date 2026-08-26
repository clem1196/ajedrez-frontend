// src/services/socketService.ts
import { io, Socket } from "socket.io-client";
import { useGameStore } from "../stores/gameStore";
import { useAuthStore } from "../stores/authStore";
import router from "@/router";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:4000";

// ✅ Configuración de socket con reconexión automática
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

let isReconnecting = false;

const resetReconnectionState = () => {
  isReconnecting = false;
};

const attemptReconnection = (roomId: string, nick: string) => {
  if (isReconnecting) return;

  isReconnecting = true;
  console.log(`🔄 [Socket] Solicitando reconexión a sala ${roomId} como ${nick}`);

  socket.emit("reconnect_to_room", {
    roomId,
    nick,
  });
};

// ==========================================
// LISTENERS DE SOCKET.IO
// ==========================================

socket.on("game_started", (data) => {
  console.log("⚔️ ¡EVENTO GAME_STARTED DETECTADO!", data);

  const gameStore = useGameStore();
  gameStore.startGame(data);

  // Guardar en sessionStorage para permitir recarga de página (F5)
  if (data.roomId && data.myNick) {
    sessionStorage.setItem("game_room_id", data.roomId);
    sessionStorage.setItem("game_player_nick", data.myNick);
    sessionStorage.setItem("game_my_color", data.myColor);
  }

  router.push("/game");
});

socket.on(
  "move_made",
  (data: {
    fen: string;
    turn: "w" | "b";
    move: any;
    whiteTime: number;
    blackTime: number;
  }) => {
    const gameStore = useGameStore();
    gameStore.gameStarted = true;
    gameStore.currentFen = data.fen;
    gameStore.moveCount++;
    gameStore.whiteTime = data.whiteTime;
    gameStore.blackTime = data.blackTime;
    if (data.move?.from && data.move?.to) {
      gameStore.lastMove = [data.move.from, data.move.to];
    }
  }
);

socket.on("connect", () => {
  const gameStore = useGameStore();
  gameStore.isConnected = true;
  console.log("🔌 Socket conectado ID:", socket.id);

  const savedRoomId = sessionStorage.getItem("game_room_id");
  const savedNick = sessionStorage.getItem("game_player_nick");

  if (savedRoomId && savedNick && !gameStore.gameEnded && !isReconnecting) {
    console.log(`🔄 [Socket] Detectada sala guardada, reconectando...`);
    attemptReconnection(savedRoomId, savedNick);
  } else if (savedRoomId && savedNick && gameStore.gameEnded) {
    sessionStorage.removeItem("game_room_id");
    sessionStorage.removeItem("game_player_nick");
    sessionStorage.removeItem("game_my_color");
  }
});

socket.on(
  "reconnect_success",
  (data: {
    fen: string;
    whiteTime: number;
    blackTime: number;
    turn: "w" | "b";
    moveCount: number;
    myColor: "w" | "b";
  }) => {
    console.log("✅ [Socket] Reconexión exitosa!");
    resetReconnectionState();

    const gameStore = useGameStore();
    gameStore.currentFen = data.fen;
    gameStore.whiteTime = data.whiteTime;
    gameStore.blackTime = data.blackTime;
    gameStore.moveCount = data.moveCount;
    gameStore.myColor = data.myColor;
    gameStore.gameStarted = true;
    gameStore.isPaused = false;
    gameStore.isReconnecting = false;

    console.log("🎮 Partida reanudada tras reconexión");
  }
);

socket.on("disconnect", (reason) => {
  const gameStore = useGameStore();
  gameStore.isConnected = false;
  console.log(`🔌 Socket desconectado: ${reason}`);

  if (reason === "io client disconnect") {
    resetReconnectionState();
    return;
  }
});

socket.on("player_disconnected", (data: { message: string; waitingTime: number }) => {
  const gameStore = useGameStore();
  gameStore.opponentDisconnected = true;
  gameStore.opponentDisconnectedMessage = data.message;
  gameStore.reconnectionTime = data.waitingTime;
  gameStore.isPaused = true;
});

socket.on("player_reconnected", (data: { message: string }) => {
  const gameStore = useGameStore();
  gameStore.opponentDisconnected = false;
  gameStore.opponentDisconnectedMessage = "";
  gameStore.reconnectionTime = 0;
  gameStore.isPaused = false;
});

socket.on("game_resumed", (data: { message: string }) => {
  const gameStore = useGameStore();
  gameStore.isPaused = false;
});

socket.on(
  "game_state_sync",
  (data: {
    fen: string;
    whiteTime: number;
    blackTime: number;
    turn: "w" | "b";
    moveCount: number;
    myColor: "w" | "b";
  }) => {
    const gameStore = useGameStore();
    gameStore.currentFen = data.fen;
    gameStore.whiteTime = data.whiteTime;
    gameStore.blackTime = data.blackTime;
    gameStore.moveCount = data.moveCount;
    gameStore.myColor = data.myColor;
    gameStore.gameStarted = true;
    gameStore.isPaused = false;
    gameStore.isReconnecting = false;

    if (isReconnecting) resetReconnectionState();
  }
);

socket.on("illegal_move", (data: { fen: string }) => {
  const gameStore = useGameStore();
  gameStore.currentFen = data.fen;
});

socket.on("draw_offered", () => {
  const gameStore = useGameStore();
  gameStore.drawOfferedByOpponent = true;
});

socket.on("draw_offer_canceled", () => {
  const gameStore = useGameStore();
  gameStore.drawOfferedByOpponent = false;
});

socket.on("receive_message", (messageData) => {
  const gameStore = useGameStore();
  gameStore.messages.push(messageData);
});

socket.on(
  "player_afk",
  (data: {
    afkPlayerColor: string;
    message: string;
    isYou: boolean;
    countdownStart?: boolean;
    countdownTime?: number;
  }) => {
    const gameStore = useGameStore();
    if (data.isYou) {
      gameStore.afkWarning = data.message;
      if (data.countdownStart) {
        gameStore.afkCountdown = data.countdownTime || 20;
      }
    } else {
      gameStore.opponentAfkMessage = data.message;
    }
  }
);

socket.on("afk_countdown_update", (data: { timeRemaining: number; message: string }) => {
  const gameStore = useGameStore();
  gameStore.afkCountdown = data.timeRemaining;
  gameStore.afkWarning = data.message;
});

socket.on(
  "bot_joined",
  (data: { nick: string; elo: number; color: string; difficulty: string }) => {
    const gameStore = useGameStore();
    const opponentColor = gameStore.myColor === "w" ? "b" : "w";

    if (data.color === opponentColor) {
      gameStore.opponentNick = data.nick;
      gameStore.opponentElo = data.elo;
      gameStore.isBotOpponent = true;
    }
  }
);

socket.on(
  "game_over",
  (data: {
    reason: string;
    loserSocketId?: string;
    message: string;
    winnerMessage?: string;
    loserMessage?: string;
    whiteEloChange?: number;
    blackEloChange?: number;
    players?: Array<{ nick: string; newElo: number; eloChange: number }>;
  }) => {
    const gameStore = useGameStore();
    const authStore = useAuthStore();

    gameStore.gameEnded = true;
    gameStore.isReconnecting = false;
    gameStore.isPaused = false;
    gameStore.opponentDisconnected = false;
    gameStore.opponentDisconnectedMessage = "";

    resetReconnectionState();

    sessionStorage.removeItem("game_room_id");
    sessionStorage.removeItem("game_player_nick");
    sessionStorage.removeItem("game_my_color");

    if (data.winnerMessage && data.loserMessage) {
      gameStore.endGameMessage = socket.id !== data.loserSocketId ? data.winnerMessage : data.loserMessage;
    } else if (data.reason === "surrender") {
      gameStore.endGameMessage = socket.id === data.loserSocketId ? "Derrota: Perdiste por abandono." : "Victoria: Ganaste por abandono del oponente.";
    } else if (data.reason === "inactivity_kick") {
      gameStore.endGameMessage = socket.id === data.loserSocketId ? "Derrota: Perdiste por inactividad." : "Victoria: Ganaste por inactividad del oponente.";
    } else if (data.reason === "checkmate") {
      gameStore.endGameMessage = socket.id === data.loserSocketId ? "Derrota por jaque mate." : "Victoria por jaque mate.";
    } else if (data.reason === "aborted") {
      gameStore.endGameMessage = "Partida Abortada: No se alteró la puntuación.";
    } else {
      gameStore.endGameMessage = data.message;
    }

    if (data.reason !== "aborted" && data.reason !== "abort_by_inactivity") {
      if (data.whiteEloChange !== undefined && data.blackEloChange !== undefined) {
        if (gameStore.myColor === "w") {
          gameStore.eloChange = data.whiteEloChange;
          gameStore.opponentEloChange = data.blackEloChange;
        } else {
          gameStore.eloChange = data.blackEloChange;
          gameStore.opponentEloChange = data.whiteEloChange;
        }
      }

      if (authStore.user && data.players?.length) {
        const myMatchData = data.players.find((p) => p.nick === authStore.user?.nick);
        if (myMatchData) {
          authStore.user.elo = myMatchData.newElo;
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              parsedUser.elo = myMatchData.newElo;
              localStorage.setItem("user", JSON.stringify(parsedUser));
            } catch (e) {
              console.error("Error actualizando localStorage:", e);
            }
          }
        }
      }
    }
  }
);

socket.on("rematch_requested", () => {
  const gameStore = useGameStore();
  gameStore.rematchOfferedByOpponent = true;
  gameStore.rematchDeclinedByOpponent = false;
  gameStore.iRequestedRematch = false;
});

socket.on("rematch_declined", () => {
  const gameStore = useGameStore();
  gameStore.iRequestedRematch = false;
  gameStore.rematchOfferedByOpponent = false;
  gameStore.rematchDeclinedByOpponent = true;
  gameStore.gameEnded = true;
});

socket.on("clock_update", (data: { whiteTime: number; blackTime: number }) => {
  const gameStore = useGameStore();
  gameStore.gameStarted = true;
  gameStore.whiteTime = data.whiteTime;
  gameStore.blackTime = data.blackTime;
});

socket.on("afk_cleared", () => {
  const gameStore = useGameStore();
  gameStore.opponentDisconnected = false;
  gameStore.opponentDisconnectedMessage = "";
  gameStore.reconnectionTime = 0;
  gameStore.isPaused = false;
});