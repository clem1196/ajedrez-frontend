// src/services/socketService.ts
import { io, Socket } from "socket.io-client";
import { useGameStore } from "../stores/gameStore";
import { useAuthStore } from "../stores/authStore";
import router from "@/router";

// ✅ Configuración de socket con reconexión automática
export const socket: Socket = io("http://localhost:4000", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

// ✅ Variables de reconexión


let isReconnecting = false;

// ✅ Función para resetear el estado de reconexión
const resetReconnectionState = () => { 
  isReconnecting = false; 
};

// ✅ Función para intentar reconectar
const attemptReconnection = (roomId: string, nick: string) => {
  if (isReconnecting) return; // Evitar emisiones duplicadas

  isReconnecting = true;
  console.log(
    `🔄 [Socket] Solicitando reconexión a sala ${roomId} como ${nick}`,
  );

  // Emitimos UNA VEZ. El backend responderá con "reconnect_success" o "reconnect_failed"
  socket.emit("reconnect_to_room", {
    roomId: roomId,
    nick: nick,
  });
};

// ✅ Escuchar eventos del servidor
socket.on("game_started", (data) => {
  console.log("⚔️ ¡EVENTO GAME_STARTED DETECTADO!");
  console.log("Mi Socket ID local actual es:", socket.id);
  console.log("Datos de la sala recibidos desde el Backend:", data);

  const gameStore = useGameStore();
  gameStore.startGame(data);
  router.push("/game");
});

// ✅ Escuchar movimientos
socket.on(
  "move_made",
  (data: {
    fen: string;
    turn: "w" | "b";
    move: any;
    whiteTime: number;
    blackTime: number;
  }) => {
    console.log(
      "📡 Sincronización WebSockets: Nuevo movimiento oficial",
      data.fen,
    );
    const gameStore = useGameStore();
    gameStore.gameStarted = true;
    gameStore.currentFen = data.fen;
    gameStore.moveCount++;
    gameStore.whiteTime = data.whiteTime;
    gameStore.blackTime = data.blackTime;
    if (data.move && data.move.from && data.move.to) {
      gameStore.lastMove = [data.move.from, data.move.to];
    }
  },
);

// ✅ Cuando el socket se conecta, intentar reconectar si hay sala guardada
socket.on("connect", () => {
  const gameStore = useGameStore();
  gameStore.isConnected = true;
  console.log("🔌 Socket conectado. Nuevo Socket ID:", socket.id);

  const savedRoomId = sessionStorage.getItem("game_room_id");
  const savedNick = sessionStorage.getItem("game_player_nick");

  if (savedRoomId && savedNick && !gameStore.gameEnded && !isReconnecting) {
    console.log(
      `🔄 [Socket] Detectada sala guardada, solicitando reconexión...`,
    );
    attemptReconnection(savedRoomId, savedNick);
  } else if (savedRoomId && savedNick && gameStore.gameEnded) {
    sessionStorage.removeItem("game_room_id");
    sessionStorage.removeItem("game_player_nick");
    sessionStorage.removeItem("game_my_color");
    console.log(`🧹 [Socket] Partida terminada, limpiando sessionStorage`);
  }
});

// ✅ Escuchar reconexión exitosa
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

    // ✅ Actualizar estado del juego
    gameStore.currentFen = data.fen;
    gameStore.whiteTime = data.whiteTime;
    gameStore.blackTime = data.blackTime;
    gameStore.moveCount = data.moveCount;
    gameStore.myColor = data.myColor;
    gameStore.gameStarted = true;
    gameStore.isPaused = false;
    gameStore.isReconnecting = false;

    // ✅ Limpiar sessionStorage (ya no necesitamos la sala guardada)
    sessionStorage.removeItem("game_room_id");
    sessionStorage.removeItem("game_player_nick");
    sessionStorage.removeItem("game_my_color");

    console.log("🎮 Partida reanudada");
  },
);

// ✅ Escuchar desconexión
socket.on("disconnect", (reason) => {
  const gameStore = useGameStore();
  gameStore.isConnected = false;
  console.log(`🔌 Socket desconectado: ${reason}`);

  // ✅ Si es una desconexión esperada (cierre de navegador), no intentar reconectar
  if (reason === "io client disconnect") {
    console.log("🔌 Desconexión manual, no se intentará reconectar");
    resetReconnectionState();
    return;
  }

  if (gameStore.roomId && !gameStore.gameEnded) {
    console.log(`⏳ Esperando reconexión a sala ${gameStore.roomId}`);
  }
});

// ✅ Escuchar cuando el oponente se desconecta
socket.on(
  "player_disconnected",
  (data: { message: string; waitingTime: number }) => {
    console.log("👤 Oponente desconectado:", data.message);
    const gameStore = useGameStore();
    gameStore.opponentDisconnected = true;
    gameStore.opponentDisconnectedMessage = data.message;
    gameStore.reconnectionTime = data.waitingTime;
    gameStore.isPaused = true;
  },
);

// ✅ Escuchar cuando el oponente reconecta
socket.on("player_reconnected", (data: { message: string }) => {
  console.log("👤 Oponente reconectado:", data.message);
  const gameStore = useGameStore();
  gameStore.opponentDisconnected = false;
  gameStore.opponentDisconnectedMessage = "";
  gameStore.reconnectionTime = 0;
  gameStore.isPaused = false;
});

// ✅ Escuchar cuando la partida se reanuda
socket.on("game_resumed", (data: { message: string }) => {
  console.log("🎮 Partida reanudada:", data.message);
  const gameStore = useGameStore();
  gameStore.isPaused = false;
});

// ✅ Escuchar sincronización de estado
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
    console.log("🔄 Sincronizando estado del juego");
    const gameStore = useGameStore();
    gameStore.currentFen = data.fen;
    gameStore.whiteTime = data.whiteTime;
    gameStore.blackTime = data.blackTime;
    gameStore.moveCount = data.moveCount;
    gameStore.myColor = data.myColor;
    gameStore.gameStarted = true;
    gameStore.isPaused = false;
    gameStore.isReconnecting = false;

    // ✅ Si estamos en proceso de reconexión, resetear estado
    if (isReconnecting) {
      resetReconnectionState();
    }

    const isMyTurn =
      (data.turn === "w" && data.myColor === "w") ||
      (data.turn === "b" && data.myColor === "b");
    if (isMyTurn) {
      console.log("🎯 Es tu turno, puedes mover");
    }
  },
);

socket.on("illegal_move", (data: { fen: string }) => {
  const gameStore = useGameStore();
  gameStore.currentFen = data.fen;
});

socket.on("draw_offered", () => {
  const gameStore = useGameStore();
  gameStore.drawOfferedByOpponent = true;
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
  },
);

socket.on(
  "afk_countdown_update",
  (data: { timeRemaining: number; message: string }) => {
    const gameStore = useGameStore();
    gameStore.afkCountdown = data.timeRemaining;
    gameStore.afkWarning = data.message;
  },
);
// ✅ 1. Cuando un Bot se une a la sala (para actualizar la UI con su nombre y Elo)
socket.on(
  "bot_joined",
  (data: { nick: string; elo: number; color: string; difficulty: string }) => {
    console.log(`🤖 Bot unido a la partida: ${data.nick} (${data.elo} Elo)`);
    const gameStore = useGameStore();
    const opponentColor = gameStore.myColor === "w" ? "b" : "w";

    if (data.color === opponentColor) {
      gameStore.opponentNick = data.nick;
      gameStore.opponentElo = data.elo;
      gameStore.isBotOpponent = true;
    }
  },
);

// ✅ 2. Cuando el oponente cancela su oferta de tablas
socket.on("draw_offer_canceled", () => {
  console.log("❌ El oponente canceló su oferta de tablas.");
  const gameStore = useGameStore();
  gameStore.drawOfferedByOpponent = false;
});
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
  }) => {
    const gameStore = useGameStore();
    gameStore.gameEnded = true;
    gameStore.isReconnecting = false;
    gameStore.isPaused = false;
    gameStore.opponentDisconnected = false;
    gameStore.opponentDisconnectedMessage = "";

    // ✅ Resetear estado de reconexión
    resetReconnectionState();

    // ✅ Limpiar sessionStorage
    sessionStorage.removeItem("game_room_id");
    sessionStorage.removeItem("game_player_nick");
    sessionStorage.removeItem("game_my_color");

    if (data.winnerMessage && data.loserMessage) {
      if (socket.id !== data.loserSocketId) {
        gameStore.endGameMessage = data.winnerMessage;
      } else {
        gameStore.endGameMessage = data.loserMessage;
      }
    } else {
      if (data.reason === "surrender") {
        if (socket.id === data.loserSocketId) {
          gameStore.endGameMessage = "Derrota: Perdiste por abandono.";
        } else {
          gameStore.endGameMessage =
            "Victoria: Ganaste por abandono del oponente.";
        }
      } else if (data.reason === "inactivity_kick") {
        if (socket.id === data.loserSocketId) {
          gameStore.endGameMessage =
            "Derrota: Perdiste por abandono (Inactividad).";
        } else {
          gameStore.endGameMessage =
            "Victoria: Ganaste por inactividad del oponente.";
        }
      } else if (data.reason === "checkmate") {
        if (socket.id === data.loserSocketId) {
          gameStore.endGameMessage = "Derrota por jaque mate.";
        } else {
          gameStore.endGameMessage = "Victoria por jaque mate.";
        }
      } else if (data.reason === "aborted") {
        gameStore.endGameMessage =
          "Partida Abortada: No se alteró la puntuación.";
      } else {
        gameStore.endGameMessage = data.message;
      }
    }
    // ✅ ACTUALIZAR ELO (si viene en los datos)
    // Solo asignar si no es un aborto
    if (data.reason !== "aborted" && data.reason !== "abort_by_inactivity") {
      if (
        data.whiteEloChange !== undefined &&
        data.blackEloChange !== undefined
      ) {
        const gameStore = useGameStore();

        // ✅ CORREGIDO: Asignar el cambio de Elo según el color del jugador local
        if (gameStore.myColor === "w") {
          gameStore.eloChange = data.whiteEloChange;
          gameStore.opponentEloChange = data.blackEloChange;
        } else {
          gameStore.eloChange = data.blackEloChange;
          gameStore.opponentEloChange = data.whiteEloChange;
        }
      }
    }
    console.log(`🏁 Partida terminada: ${gameStore.endGameMessage}`);
  },
);

// 🚨 1. El oponente nos está pidiendo revancha
socket.on("rematch_requested", () => {
  const gameStore = useGameStore();
  console.log("🔥 ¡El oponente solicitó una revancha directa!");
  gameStore.rematchOfferedByOpponent = true;
  gameStore.gameEnded = true;
});

// 🚨 2. El oponente rechazó nuestra oferta de revancha
socket.on("rematch_declined", () => {
  const gameStore = useGameStore();
  console.log("❌ La propuesta de revancha fue rechazada/cancelada.");
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
