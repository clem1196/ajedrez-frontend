// src/stores/gameStore.ts
import { defineStore } from "pinia";
import { socket } from "../services/socketService";
import type { Key } from "chessground/types";
import { useAuthStore } from "./authStore";

export const useGameStore = defineStore("game", {
  state: () => ({
    roomId: "",
    nick: "",
    elo: 1200,
    selectedMinutes: 10,
    opponentNick: "",
    opponentElo: 1200,
    opponentIsGuest: true,
    myColor: "" as "w" | "b" | "",
    currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    lastMove: [] as string[] | string | null,
    isConnected: false,
    isSearching: false,
    chatAvailable: false,
    lastMoveReceived: null as any,

    // ESTADOS PARA RELOJES Y ALERTAS
    whiteTime: 600,
    blackTime: 600,
    moveDeadline: 0,
    gameStarted: false,
    drawOfferedByOpponent: false,
    gameEnded: false,
    endGameMessage: "",
    moveCount: 0,

    // Revancha
    rematchOfferedByOpponent: false,
    iRequestedRematch: false,
    rematchDeclinedByOpponent: false,

    // Results
    eloChange: 0,
    opponentEloChange: 0,
    endResult: null as { reason: string; message: string } | null,

    // ✅ Nuevas propiedades para reconexión
    isPaused: false,
    opponentDisconnected: false,
    opponentDisconnectedMessage: "",
    reconnectionTime: 0,
    isReconnecting: false,
    isBotOpponent: false,
    // Chat
    messages: [] as Array<{
      id: string;
      sender: string;
      text: string;
      timestamp: string;
    }>,
    systemMessages: [] as Array<{
      id: string;
      text: string;
      timestamp: string;
    }>,
    afkWarning: "",
    afkCountdown: 0,
    opponentAfkMessage: "",
  }),

  actions: {
    sendChatMessage(text: string) {
      if (!this.roomId) return;
      socket.emit("send_message", { roomId: this.roomId, text });
    },

    setPaused(paused: boolean) {
      this.isPaused = paused;
    },

    // ✅ Marcar que el oponente se desconectó
    setOpponentDisconnected(disconnected: boolean, time: number = 0) {
      this.opponentDisconnected = disconnected;
      this.reconnectionTime = time;
      if (disconnected) {
        this.opponentDisconnectedMessage = `Tu oponente se ha desconectado. Esperando reconexión... ${time}s`;
      } else {
        this.opponentDisconnectedMessage = "";
      }
    },

    // ✅ Actualizar tiempo de reconexión
    updateReconnectionTime(time: number) {
      this.reconnectionTime = time;
      if (this.opponentDisconnected) {
        this.opponentDisconnectedMessage = `Tu oponente se ha desconectado. Esperando reconexión... ${time}s`;
      }
    },

    // ✅ Resetear estado de reconexión
    resetReconnectionState() {
      this.isPaused = false;
      this.opponentDisconnected = false;
      this.opponentDisconnectedMessage = "";
      this.reconnectionTime = 0;
      this.isReconnecting = false;
    },

    // 💡 Buscar partida
    searchGame(playerNick: string, elo: number = 1200, minutes: number = 10) {
      const nameToUse =
        playerNick && playerNick.trim() !== ""
          ? playerNick.trim()
          : this.nick && this.nick.trim() !== ""
            ? this.nick.trim()
            : `Invitado_${Math.floor(Math.random() * 9000 + 1000)}`;

      this.nick = nameToUse;
      this.elo = elo;
      this.selectedMinutes = minutes;
      this.isSearching = true;

      if (!socket.connected) {
        socket.connect();
      }

      console.log(
        `📡 Solicitando ingreso a partida de [${minutes} min] con el nick: ${this.nick}`,
      );
      socket.emit("join_game", {
        nick: this.nick,
        elo: this.elo,
        minutes: this.selectedMinutes,
      });
    },

    setRoomData(data: {
      roomId: string;
      myColor: "w" | "b";
      playerWhite: any;
      playerBlack: any;
    }) {
      this.roomId = data.roomId;
      this.gameStarted = true;
      this.isSearching = false;

      const IAmWhite = this.myColor === "w";

      if (IAmWhite) {
        this.opponentNick = data.playerBlack.nick;
        this.opponentElo = data.playerBlack.elo || 1200;
        this.opponentIsGuest = !data.playerBlack.isRegistered;
      } else {
        this.opponentNick = data.playerWhite.nick;
        this.opponentElo = data.playerWhite.elo || 1200;
        this.opponentIsGuest = !data.playerWhite.isRegistered;
      }
    },

    // ✅ CORREGIDO: startGame con guardado en sessionStorage
    startGame(data: any) {
      this.roomId = data.roomId;
      this.currentFen = data.fen;
      this.lastMove = [];
      this.gameEnded = false;
      this.gameStarted = true;
      this.endGameMessage = "";
      this.drawOfferedByOpponent = false;
      this.moveCount = 0;
      this.chatAvailable = true;
      this.resetReconnectionState(); // ✅ Resetear estado de reconexión

      const initialSeconds =
        data.initialTimeAllocated || this.selectedMinutes * 60;
      this.whiteTime = initialSeconds;
      this.blackTime = initialSeconds;

      this.moveDeadline = data.moveDeadline || Date.now() + 60_000;

      this.rematchOfferedByOpponent = false;
      this.iRequestedRematch = false;
      this.rematchDeclinedByOpponent = false;

      console.log(`[Pinia] Mi Socket ID Local es: "${socket.id}"`);
      console.log(`[Pinia] ID recibido para Blancas: "${data.white.id}"`);

      // ✅ Asignar color y detectar bot correctamente
      if (socket.id === data.white.id) {
        this.myColor = "w";
        this.opponentNick = data.black.nick;
        this.opponentElo = data.black.elo || 1200;
        // ✅ Detectar si el oponente es un bot
        this.isBotOpponent =
          data.black.isBot ||
          data.black.nick?.toLowerCase().includes("bot_") ||
          false;
        console.log(
          "%c🟢 Asignado con éxito: Eres BLANCAS",
          "color: #00ff00; font-weight: bold;",
        );
      } else {
        this.myColor = "b";
        this.opponentNick = data.white.nick;
        this.opponentElo = data.white.elo || 1200;
        // ✅ Detectar si el oponente es un bot
        this.isBotOpponent =
          data.white.isBot ||
          data.white.nick?.toLowerCase().includes("bot_") ||
          false;
        console.log(
          "%c🟢 Asignado con éxito: Eres NEGRAS",
          "color: #00ff00; font-weight: bold;",
        );
      }

      // ✅ Mensaje si es un bot
     /* if (this.isBotOpponent) {
        console.log(`🤖 Estás jugando contra un bot: ${this.opponentNick}`);
        this.addSystemMessage(
          `🤖 Has sido emparejado con el bot ${this.opponentNick}`,
        );
      }*/

      // ✅ Guardar en sessionStorage DESPUÉS de asignar myColor
      const authStore = useAuthStore();
      const nick = authStore.isAuthenticated
        ? authStore.currentNick
        : this.nick;

      sessionStorage.setItem("game_room_id", this.roomId);
      sessionStorage.setItem("game_player_nick", nick);
      sessionStorage.setItem("game_my_color", this.myColor);

      console.log(
        `💾 [GameStore] Sala guardada en sessionStorage: ${this.roomId} para ${nick} (${this.myColor})`,
      );
    },

    setGameOver(data: {
      reason: string;
      message: string;
      whiteEloChange?: number;
      blackEloChange?: number;
    }) {
      this.gameEnded = true;
      this.endGameMessage = data.message;
      this.moveDeadline = 0;
      this.endResult = {
        reason: data.reason,
        message: data.message,
      };
      this.resetReconnectionState(); // ✅ Resetear estado de reconexión

      const whiteChange = data.whiteEloChange ?? 0;
      const blackChange = data.blackEloChange ?? 0;

      if (this.myColor === "w") {
        this.eloChange = whiteChange;
        this.opponentEloChange = blackChange;
      } else {
        this.eloChange = blackChange;
        this.opponentEloChange = whiteChange;
      }
      // ✅ ACTUALIZACIÓN OPTIMISTA LOCAL (Sin llamar a la API)
      const authStore = useAuthStore();
      if (
        authStore.isAuthenticated &&
        authStore.user &&
        data.reason !== "aborted" &&
        data.reason !== "abort_by_inactivity"
      ) {
        // Determinar el resultado para actualizar wins/losses/draws
        let result: "win" | "loss" | "draw" | undefined = undefined;
        const msg = this.endGameMessage.toLowerCase();

        if (msg.includes("victoria") || msg.includes("gana")) result = "win";
        else if (msg.includes("derrota") || msg.includes("pierde"))
          result = "loss";
        else if (
          msg.includes("tablas") ||
          msg.includes("empate") ||
          msg.includes("ahogado")
        )
          result = "draw";

        const newTotalElo = authStore.user.elo + this.eloChange;
        authStore.updateLocalElo(newTotalElo, result);
      }
      // ✅ Limpiar sessionStorage al terminar la partida
      sessionStorage.removeItem("game_room_id");
      sessionStorage.removeItem("game_player_nick");
      sessionStorage.removeItem("game_my_color");
    },

    cancelSearch() {
      this.isSearching = false;
      console.log(
        `🛑 [Pinia] Emitido evento cancel_search para el socket actual.`,
      );
    },

    // ✅ CORREGIDO: resetGame con limpieza de sessionStorage
    resetGame() {
      this.roomId = "";
      this.opponentNick = "";
      this.opponentElo = 1200;
      this.myColor = "";
      this.currentFen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      this.lastMove = [];
      this.gameEnded = false;
      this.gameStarted = false;
      this.chatAvailable = false;
      this.lastMoveReceived = null;
      this.resetReconnectionState();
      this.isBotOpponent = false;
      const syncSeconds = (this.selectedMinutes || 10) * 60;
      this.whiteTime = syncSeconds;
      this.blackTime = syncSeconds;
      this.moveDeadline = 0;

      this.isSearching = false;
      this.rematchOfferedByOpponent = false;
      this.iRequestedRematch = false;
      this.rematchDeclinedByOpponent = false;
      this.endResult = null;
      this.eloChange = 0;
      this.opponentEloChange = 0;
      this.messages = [];
      this.drawOfferedByOpponent = false;
      this.moveCount = 0;

      // ✅ Limpiar sessionStorage
      sessionStorage.removeItem("game_room_id");
      sessionStorage.removeItem("game_player_nick");
      sessionStorage.removeItem("game_my_color");
    },

    abortGame() {
      if (!this.roomId) return;
      console.log(
        `📡 [Pinia] Solicitando abortar la partida para la sala: ${this.roomId}`,
      );
      socket.emit("abort_game", { roomId: this.roomId });
      this.chatAvailable = false;

      // ✅ Limpiar sessionStorage al abortar
      sessionStorage.removeItem("game_room_id");
      sessionStorage.removeItem("game_player_nick");
      sessionStorage.removeItem("game_my_color");
    },

    // 💡 Llamado cada vez que el servidor manda un nuevo límite de jugada
    setMoveDeadline(timestampMs: number) {
      this.moveDeadline = timestampMs || 0;
    },

    clearMoveDeadline() {
      this.moveDeadline = 0;
    },
    addSystemMessage(text: string) {
      this.systemMessages.push({
        id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        text: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    },

    // ✅ Limpiar mensajes del sistema
    clearSystemMessages() {
      this.systemMessages = [];
    },
  },
});
