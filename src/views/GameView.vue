<!--src/views/GameView.vue-->
<template>
  <div class="game-container">
    <div class="game-layout">

      <!-- 🔔 BANNERS DE ESTADO (Notificaciones flotantes) -->
      <div class="banners-wrapper">
        <TransitionGroup name="banner-fade">
          <!-- Reconexión -->
          <div v-if="gameStore.isReconnecting" key="reconnecting" class="glass-banner banner-info">
            <div class="spinner-small"></div>
            <span>Reconectando a la partida...</span>
          </div>

          <!-- Desconexión del oponente -->
          <div v-if="gameStore.opponentDisconnected && !gameStore.isReconnecting" key="opponent-disconnected"
            class="glass-banner banner-warning">
            <span>⏳ {{ gameStore.opponentDisconnectedMessage }}</span>
            <span v-if="gameStore.reconnectionTime > 0" class="badge-timer">{{ gameStore.reconnectionTime }}s</span>
          </div>

          <!-- Partida pausada -->
          <div v-if="gameStore.isPaused && !gameStore.opponentDisconnected" key="paused"
            class="glass-banner banner-neutral">
            <span>⏸️ Partida en pausa</span>
          </div>

          <!-- AFK Oponente -->
          <div v-if="gameStore.opponentAfkMessage && !gameStore.afkWarning" key="opponent-afk"
            class="glass-banner banner-warning">
            <span>⏳ {{ gameStore.opponentAfkMessage }}</span>
          </div>

          <!-- AFK Propio -->
          <div v-if="gameStore.afkWarning && !gameStore.gameEnded" key="self-afk"
            class="glass-banner banner-danger pulse-danger">
            <span>⚠️ Tienes <strong>{{ gameStore.afkCountdown }}s</strong> para realizar tu jugada.</span>
          </div>

          <!-- Cortesía primer movimiento -->
          <div v-if="gameStore.moveCount === 0 && gameStore.myColor === 'w' && courtesyCountdown > 0" key="courtesy"
            class="glass-banner banner-accent">
            <span>⏱️ Tiempo de cortesía: <strong>{{ courtesyCountdown }}s</strong></span>
          </div>

          <!-- Advertencia de tiempo propio -->
          <div v-if="gameStore.gameStarted && !gameStore.gameEnded && isMyTurn && playerTimeWarning" key="time-warning"
            class="glass-banner banner-danger">
            <span>⚠️ ¡Poco tiempo! <strong>{{ formatTime(getCurrentPlayerTime()) }}</strong></span>
          </div>

          <!-- Oferta de tablas enviada -->
          <div v-if="drawOfferPending" key="offer_draw" class="glass-banner banner-info">
            <span>🤝 Propuesta de tablas enviada a <strong>{{ gameStore.opponentNick }}</strong></span>
            <button class="btn-banner-action" @click="cancelDrawOffer">Cancelar</button>
          </div>
        </TransitionGroup>
      </div>

      <!-- 👤 JUGADOR SUPERIOR (RIVAL) -->
      <header class="player-bar opponent-bar">
        <div class="player-profile">
          <div class="avatar-box">♟️</div>
          <div class="player-meta">
            <div class="player-name-row">
              <span class="player-name">{{ gameStore.opponentNick || 'Buscando rival...' }}</span>
            </div>
            <div class="player-tag" :class="{ 'tag-rated': gameStore.opponentNick }">
              {{ gameStore.opponentNick ? `📈 Elo: ${gameStore.opponentElo}` : 'ESPERANDO' }}
            </div>
          </div>
        </div>

        <div class="player-controls">
          <!-- Botón Mute / Unmute -->
          <button class="btn-glass" style="padding: 0.4rem 0.6rem; margin-right: 0.5rem;" @click="toggleMute"
            :title="isMuted ? 'Activar Sonido' : 'Silenciar'">
            <span v-if="isMuted">🔇</span>
            <span v-else>🔊</span>
          </button>
          <!-- Selector de Temas sutil -->
          <div class="theme-picker">
            <select v-model="currentThemeId" class="theme-select" aria-label="Tema del tablero">
              <option v-for="theme in boardThemes" :key="theme.id" :value="theme.id">
                🎨 {{ theme.name }}
              </option>
            </select>
          </div>

          <!-- Reloj Oponente -->
          <div class="chess-clock" :class="{
            'clock-active': gameStore.gameStarted && !isMyTurn,
            'clock-warning': gameStore.gameStarted && !isMyTurn && getOpponentTime() < 10
          }">
            {{ formatTime(getOpponentTime()) }}
          </div>
        </div>
      </header>

      <!-- 🏁 TABLERO DE AJEDREZ -->
      <main class="board-wrapper" :style="{
        '--board-bg': boardBackground,
        '--selected': currentTheme?.selected,
        '--last-move': currentTheme?.lastMove,
        '--check': currentTheme?.check,
        '--moveDot': currentTheme?.moveDot,
        '--moveRing': currentTheme?.moveDot,
        '--border': currentTheme?.border,
        '--coordinates': currentTheme?.coordinates,
        '--shadow': currentTheme?.shadow
      }" :class="{ 'board-blocked': !isMyTurn || gameStore.gameEnded || gameStore.isPaused }">
        <TheChessboard :board-config="boardConfig" @board-created="handleBoardCreated" @move="handleLocalMove" />
      </main>

      <!-- 👤 JUGADOR INFERIOR (TÚ) -->
      <footer class="player-bar player-local-bar">
        <div class="player-profile">
          <div class="avatar-box my-avatar">👤</div>
          <div class="player-meta">
            <span class="player-name">{{ gameStore.nick }} <small class="text-muted">(Tú)</small></span>
            <div class="player-tag tag-rated">📈 Elo: {{ gameStore.elo }}</div>
          </div>
        </div>

        <!-- Reloj Propio -->
        <div class="chess-clock" :class="{
          'clock-active': gameStore.gameStarted && isMyTurn,
          'clock-warning': gameStore.gameStarted && isMyTurn && getCurrentPlayerTime() < 10
        }">
          {{ formatTime(getCurrentPlayerTime()) }}
        </div>
      </footer>

      <!-- ⚙️ PANEL DE ACCIONES -->
      <nav class="action-panel" v-if="!gameStore.gameEnded">
        <template v-if="gameStore.moveCount <= 1">
          <button class="btn-glass btn-glass-danger" @click="gameStore.abortGame">
            ⏱️ Abortar
          </button>
        </template>
        <template v-else>
          <button class="btn-glass btn-glass-danger" @click="surrender">
            🏳️ Abandonar
          </button>
          <button class="btn-glass btn-glass-warning" @click="offerDraw" :disabled="drawOfferPending">
            🤝 {{ drawOfferPending ? 'Esperando...' : 'Ofrecer Tablas' }}
          </button>
        </template>
      </nav>
      <GameChat v-if="currentWidth <= 624" />

      <!-- 🪟 MODAL DE RESULTADOS / REVANCHA -->
      <Transition name="modal-fade">
        <div class="game-modal"
          v-if="gameStore.drawOfferedByOpponent || gameStore.gameEnded || gameStore.rematchOfferedByOpponent || gameStore.iRequestedRematch || gameStore.rematchDeclinedByOpponent">
          <div class="modal-card">

            <!-- Header del Modal -->
            <header class="modal-header">
              <h3 v-if="gameStore.rematchOfferedByOpponent" class="title-rematch">🔥 ¡Reto Recibido!</h3>
              <h3 v-else-if="gameStore.iRequestedRematch" class="title-waiting">⌛ Desafío Enviado</h3>
              <h3 v-else-if="gameStore.rematchDeclinedByOpponent" class="title-declined">❌ Revancha Rechazada</h3>
              <h3 v-else-if="gameStore.gameEnded" class="title-ended">
                {{ gameStore.endGameMessage.includes('Abortada') ? 'Sala Abortada' : 'Fin de la Partida' }}
              </h3>
              <h3 v-else class="title-draw">🤝 ¡Propuesta de Tablas!</h3>
            </header>

            <!-- Cuerpo del Modal -->
            <div class="modal-body">
              <p class="modal-message">
                <template v-if="gameStore.rematchOfferedByOpponent">
                  <strong>{{ gameStore.opponentNick }}</strong> te ofrece una revancha con colores invertidos.
                </template>
                <template v-else-if="gameStore.iRequestedRematch">
                  Esperando respuesta de <strong>{{ gameStore.opponentNick }}</strong>...
                </template>
                <template v-else-if="gameStore.rematchDeclinedByOpponent">
                  <strong>{{ gameStore.opponentNick }}</strong> ha rechazado la solicitud de revancha.
                </template>
                <template v-else>
                  {{ gameStore.gameEnded ? gameStore.endGameMessage : `Tu oponente te ofrece declarar tablas.` }}
                </template>
              </p>

              <!-- Resumen Elo tras terminar -->
              <div v-if="gameStore.gameEnded && !gameStore.endGameMessage.includes('Abortada')" class="elo-card">
                <div class="elo-row">
                  <span class="user-label">🏆 {{ gameStore.nick }}</span>
                  <span class="elo-badge" :class="myVisualEloChange >= 0 ? 'elo-plus' : 'elo-minus'">
                    {{ myVisualEloChange >= 0 ? `+${myVisualEloChange}` : myVisualEloChange }} Elo
                  </span>
                </div>
                <div class="elo-divider"></div>
                <div class="elo-row">
                  <span class="opponent-label">⚔️ {{ gameStore.opponentNick || 'Oponente' }}</span>
                  <span class="elo-badge" :class="opponentVisualEloChange >= 0 ? 'elo-plus' : 'elo-minus'">
                    {{ opponentVisualEloChange >= 0 ? `+${opponentVisualEloChange}` : opponentVisualEloChange }} Elo
                  </span>
                </div>
              </div>

              <!-- Mensaje de registro / call to action -->
              <div
                v-if="gameStore.gameEnded && !gameStore.iRequestedRematch && !gameStore.rematchOfferedByOpponent && !gameStore.rematchDeclinedByOpponent"
                class="cta-box">
                <p>
                  {{ authStore.isAuthenticated ? '¿Qué deseas hacer a continuación?' : `Regístrate para guardar tus
                  estadísticas y subir en el Ranking.` }}
                </p>
              </div>
            </div>

            <!-- Botones del Modal -->
            <footer class="modal-actions">

              <!-- 1. Propuesta de Tablas en partida activa -->
              <template v-if="gameStore.drawOfferedByOpponent && !gameStore.gameEnded">
                <button class="btn-glass btn-glass-success" @click="acceptDraw">🤝 Aceptar</button>
                <button class="btn-glass btn-glass-danger" @click="gameStore.drawOfferedByOpponent = false">❌
                  Rechazar</button>
              </template>

              <!-- 2. Esperando respuesta de mi solicitud de revancha -->
              <template v-else-if="gameStore.iRequestedRematch">
                <div class="spinner-small"></div>
                <button class="btn-glass btn-glass-danger full-width" @click="cancelRematch">❌ Cancelar
                  Solicitud</button>
              </template>

              <!-- 3. Solicitud de Revancha recibida del oponente -->
              <template v-else-if="gameStore.rematchOfferedByOpponent">
                <button class="btn-glass btn-glass-success" @click="acceptRematch">⚔️ Aceptar Revancha</button>
                <button class="btn-glass btn-glass-danger" @click="declineRematch">❌ Rechazar</button>
              </template>

              <!-- 4. Si el oponente rechazó la revancha -->
              <template v-else-if="gameStore.rematchDeclinedByOpponent">
                <div class="actions-grid">
                  <button v-if="authStore.isAuthenticated" class="btn-glass btn-glass-success" @click="handlePlay">
                    🎮 Buscar Otro Rival
                  </button>
                  <button v-else class="btn-glass btn-glass-accent" @click="goToRegister">
                    💎 Crear Cuenta
                  </button>
                </div>
                <button class="btn-link" @click="exitGame">
                  ← Volver al Menú Principal
                </button>
              </template>

              <!-- 5. Fin de Partida / Opciones Post-Game Estándar -->
              <template v-else>
                <div class="actions-grid">
                  <button v-if="!gameStore.endGameMessage.includes('Abortada')" class="btn-glass btn-glass-primary"
                    @click="requestRematch">
                    ⚔️ Pedir Revancha
                  </button>

                  <button v-if="gameStore.endGameMessage.includes('Abortada')" class="btn-glass btn-glass-primary"
                    @click="rematchGame">
                    🔄 Nueva Partida
                  </button>

                  <button v-if="authStore.isAuthenticated" class="btn-glass btn-glass-success" @click="handlePlay">
                    🎮 Buscar Rival
                  </button>

                  <button v-if="!authStore.isAuthenticated" class="btn-glass btn-glass-accent" @click="goToRegister">
                    💎 Crear Cuenta
                  </button>
                </div>

                <button class="btn-link" @click="exitGame">
                  ← Volver al Menú Principal
                </button>
              </template>

            </footer>

          </div>
        </div>
      </Transition>

    </div>
    <GameChat v-if="currentWidth > 624" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { socket } from '../services/socketService';
import { BoardApi, TheChessboard } from 'vue3-chessboard';
import GameChat from '../components/GameChat.vue';
import 'vue3-chessboard/style.css';
import router from '@/router';
import { Chess } from 'chess.js';
import type { Key } from 'chessground/types';
import { boardThemes } from '@/utils/chessUtil.ts';
import { createBoardBackground } from '@/utils/boardThemeEngine.ts';
import { useAudio } from '@/composables/useAudio';

const { isMuted, playSound, toggleMute } = useAudio();

const gameStore = useGameStore();
const authStore = useAuthStore();

// ✅ Estado local SOLO para UI
const currentWidth = ref(window.innerWidth);
const drawOfferPending = ref(false);
const drawOfferNotification = ref(false);
const courtesyCountdown = ref(60);
let courtesyInterval: ReturnType<typeof setInterval> | null = null;
const shouldAnimate = ref(true);
const currentThemeId = ref(localStorage.getItem('chess_theme') || 'green');

watch(currentThemeId, (newTheme) => {
  localStorage.setItem('chess_theme', newTheme);
});

const boardBackground = computed(() => {
  if (!currentTheme.value) return '';
  return createBoardBackground(
    currentTheme.value.light,
    currentTheme.value.dark
  );
});

const currentTheme = computed(() =>
  boardThemes.find(t => t.id === currentThemeId.value) ?? boardThemes[0]
);

const boardAPI = ref<BoardApi | null>(null);

function handleBoardCreated(api: BoardApi) {
  boardAPI.value = api;
}

// 🎯 CONTROL DE TURNO CORREGIDO
const fenTurn = computed(() => {
  if (!gameStore.currentFen) return 'w';
  const parts = gameStore.currentFen.split(' ');
  return parts[1] || 'w'; // 'w' o 'b'
});

const isMyTurn = computed(() => {
  if (gameStore.gameEnded || gameStore.isPaused) return false;
  return fenTurn.value === gameStore.myColor;
});

// 🏁 CONFIGURACIÓN DEL TABLERO
const boardConfig = computed(() => {
  const myColorFull: "white" | "black" = gameStore.myColor === 'w' ? 'white' : 'black';
  const canMove = isMyTurn.value && !gameStore.gameEnded && !gameStore.isPaused;

  return {
    coordinates: true,
    fen: gameStore.currentFen,
    orientation: myColorFull,
    lastMove: formattedLastMove.value,
    animation: { enabled: shouldAnimate.value, duration: 200 },
    movable: {
      color: canMove ? myColorFull : undefined,
      free: false,
      dests: canMove ? getDests(gameStore.currentFen) : new Map(),
    },
    draggable: {
      enabled: canMove
    },
    boardStyle: {
      '--cg-cc-light': currentTheme.value?.light,
      '--cg-cc-dark': currentTheme.value?.dark,
    }
  };
});

const getCurrentPlayerTime = (): number => {
  return gameStore.myColor === 'w' ? gameStore.whiteTime : gameStore.blackTime;
};

const getOpponentTime = (): number => {
  return gameStore.myColor === 'w' ? gameStore.blackTime : gameStore.whiteTime;
};

const playerTimeWarning = computed(() => {
  if (!gameStore.gameStarted || gameStore.gameEnded) return false;
  const time = getCurrentPlayerTime();
  return time > 0 && time < 10;
});

const getDests = (fen: string) => {
  try {
    const chess = new Chess(fen);
    const dests = new Map();

    chess.moves({ verbose: true }).forEach(move => {
      if (!dests.has(move.from)) {
        dests.set(move.from, []);
      }
      dests.get(move.from).push(move.to);
    });

    return dests;
  } catch (e) {
    console.error("Error al calcular dests:", e);
    return new Map();
  }
};

const formattedLastMove = computed(() => {
  const rawMove = gameStore.lastMove as unknown;

  if (!rawMove) return undefined;

  if (typeof rawMove === 'string' && rawMove.length === 4) {
    return [
      rawMove.substring(0, 2) as Key,
      rawMove.substring(2, 4) as Key
    ] as [Key, Key];
  }

  if (Array.isArray(rawMove) && rawMove.length === 2) {
    return [
      String(rawMove[0]) as Key,
      String(rawMove[1]) as Key
    ] as [Key, Key];
  }

  return undefined;
});

const updateWidth = () => {
  currentWidth.value = window.innerWidth;
};

const startCourtesyTimer = () => {
  if (courtesyInterval !== null) {
    clearInterval(courtesyInterval);
    courtesyInterval = null;
  }

  courtesyCountdown.value = 60;

  courtesyInterval = setInterval(() => {
    if (courtesyCountdown.value > 0) {
      courtesyCountdown.value--;
    } else {
      stopCourtesyTimer();
    }
  }, 1000);
};

const stopCourtesyTimer = () => {
  if (courtesyInterval !== null) {
    clearInterval(courtesyInterval);
    courtesyInterval = null;
  }
};

// 🎯 Manejar movimiento local
const handleLocalMove = (moveInfo: any) => {
  if (gameStore.gameEnded || gameStore.isPaused || gameStore.drawOfferedByOpponent) return;

  if (!isMyTurn.value) {
    console.warn("[Anti-Cheat] No es tu turno de mover.");
    playSound('illegal');
    return;
  }

  socket.emit('make_move', {
    roomId: gameStore.roomId,
    move: {
      from: moveInfo.from,
      to: moveInfo.to,
      promotion: moveInfo.promotion || 'q'
    }
  });

  stopCourtesyTimer();
};

// 📢 Acciones de botones
const surrender = () => {
  if (confirm('¿Seguro que deseas abandonar la partida?')) {
    socket.emit('surrender', { roomId: gameStore.roomId });
  }
};

const offerDraw = () => {
  if (drawOfferPending.value) return;
  drawOfferPending.value = true;
  drawOfferNotification.value = true;
  socket.emit('offer_draw', { roomId: gameStore.roomId });

  setTimeout(() => {
    if (drawOfferPending.value) cancelDrawOffer();
  }, 30000);
};

const cancelDrawOffer = () => {
  drawOfferPending.value = false;
  drawOfferNotification.value = false;
  socket.emit('cancel_draw_offer', { roomId: gameStore.roomId });
};

const acceptDraw = () => {
  socket.emit('accept_draw', { roomId: gameStore.roomId });
};

const exitGame = () => {
  gameStore.resetGame();
  router.push('/');
};

const requestRematch = () => {
  gameStore.iRequestedRematch = true;
  socket.emit('propose_rematch', { roomId: gameStore.roomId });
};

const cancelRematch = () => {
  gameStore.iRequestedRematch = false;
  socket.emit('cancel_rematch_proposal', { roomId: gameStore.roomId });
};

const declineRematch = () => {
  gameStore.rematchOfferedByOpponent = false;
  socket.emit('rematch_declined', { roomId: gameStore.roomId });
};

const acceptRematch = () => {
  socket.emit('accept_rematch', { roomId: gameStore.roomId });
};

const rematchGame = () => {
  const currentNick = authStore.isAuthenticated ? authStore.currentNick : gameStore.nick;
  gameStore.resetGame();
  gameStore.searchGame(currentNick, authStore.currentElo || gameStore.elo, gameStore.selectedMinutes);
  router.push('/');
};

const goToRegister = () => {
  sessionStorage.setItem('guest_backup_nick', gameStore.nick);
  sessionStorage.setItem('guest_backup_elo', gameStore.elo.toString());
  router.push('/register');
};

const formatTime = (seconds: number): string => {
  if (!gameStore.gameStarted) {
    const initialMinutes = gameStore.selectedMinutes;
    return `${initialMinutes.toString().padStart(2, '0')}:00`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const myVisualEloChange = computed(() => {
  if (gameStore.eloChange !== 0) return gameStore.eloChange;
  const msg = gameStore.endGameMessage.toLowerCase();
  if (msg.includes('tablas') || msg.includes('empate') || msg.includes('abortada')) return 0;
  if (msg.includes('victoria') || msg.includes('gana')) return 16;
  if (msg.includes('derrota') || msg.includes('pierde')) return -16;
  return 0;
});

const opponentVisualEloChange = computed(() => {
  if (gameStore.opponentEloChange !== 0) return gameStore.opponentEloChange;
  return -myVisualEloChange.value;
});

const handlePlay = () => {
  if (authStore.isAuthenticated) {
    gameStore.cancelSearch();
    const lastSelectedMinutes = gameStore.selectedMinutes;
    gameStore.resetGame();
    router.push('/');
    setTimeout(() => {
      gameStore.searchGame(
        authStore.currentNick,
        authStore.currentElo,
        lastSelectedMinutes
      );
    }, 100);
  }
};

// 🔄 WATCHERS
watch(
  () => gameStore.roomId,
  (newRoomId, oldRoomId) => {
    if (newRoomId && newRoomId !== oldRoomId) {
      console.log(`🔄 Reiniciando estado por cambio de sala: ${oldRoomId} -> ${newRoomId}`);
      
      // Detener timers locales
      stopCourtesyTimer();
      
      // Limpiar modales y estados de fin de juego
      drawOfferPending.value = false;
      drawOfferNotification.value = false;
      
      // Forzar al tablero UI a cargar la posición actual (FEN inicial de la revancha)
      if (boardAPI.value && gameStore.currentFen) {
        boardAPI.value.setConfig({
          fen: gameStore.currentFen,
          orientation: gameStore.myColor === 'w' ? 'white' : 'black',
          lastMove: undefined,
        });
      }
    }
  }
);
watch(() => gameStore.moveCount, (newCount) => {
  if (newCount === 1) {
    stopCourtesyTimer();
  }
});

watch(() => gameStore.gameEnded, (ended) => {
  if (ended) {
    stopCourtesyTimer();
    drawOfferPending.value = false;
    drawOfferNotification.value = false;
    playSound('gameOver');
  }
});

watch(
  () => gameStore.currentFen,
  (newFen, oldFen) => {
    if (!boardAPI.value || !newFen || !oldFen) return;

    try {
      const chessBefore = new Chess(oldFen);
      const chessAfter = new Chess(newFen);

      if (chessAfter.isGameOver() || chessAfter.isDraw()) {
        playSound('gameOver');
      } else if (chessAfter.inCheck()) {
        playSound('check');
      } else {
        const countPieces = (c: Chess) => c.board().flat().filter(Boolean).length;
        const isCapture = countPieces(chessBefore) > countPieces(chessAfter);

        if (isCapture) {
          playSound('capture');
        } else {
          playSound('move');
        }
      }
    } catch (e) {
      console.error('Error procesando audio del movimiento:', e);
    }

    const turn = newFen.split(" ")[1];
    const isOpponentMove = turn === gameStore.myColor;

    if (isOpponentMove) {
      boardAPI.value.setConfig({
        fen: newFen,
        lastMove: formattedLastMove.value,
      });
    }

    shouldAnimate.value = isOpponentMove;

    setTimeout(() => {
      shouldAnimate.value = true;
    }, 300);
  }
);

onBeforeMount(() => {
  const savedRoomId = sessionStorage.getItem('game_room_id');
  const savedNick = sessionStorage.getItem('game_player_nick');
  const savedColor = sessionStorage.getItem('game_my_color');

  if (savedRoomId && savedNick && !gameStore.gameStarted && !gameStore.gameEnded) {
    gameStore.roomId = savedRoomId;
    gameStore.nick = savedNick;
    if (savedColor === 'w' || savedColor === 'b') {
      gameStore.myColor = savedColor as 'w' | 'b';
    }
    if (!socket.connected) {
      socket.connect();
    }
  }
});

onMounted(() => {
  window.addEventListener('resize', updateWidth);

  if (gameStore.moveCount === 0 && gameStore.myColor === 'w') {
    startCourtesyTimer();
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth);
  stopCourtesyTimer();
});
</script>

<style scoped>
/* ==========================================================================
   1. VARIABLES & PALETA DE COLORES (GLASSMORPHISM PREM)
   ========================================================================== */
:root {
  --bg-main: #0f1015;
  --glass-bg: rgba(22, 24, 34, 0.75);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: blur(16px);
  --accent-cyan: #38bdf8;
  --accent-green: #22c55e;
  --accent-red: #ef4444;
  --accent-amber: #f59e0b;
  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
}

/* ==========================================================================
   2. ESTRUCTURA BASE Y LAYOUT
   ========================================================================== */

.game-container {
  min-height: 100vh;
  background-color: #0d0e12;
  background-image:
    radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.05) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(34, 197, 94, 0.03) 0px, transparent 50%);
  color: #f3f4f6;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12px 8px;
  box-sizing: border-box;
}

.game-layout {
  position: relative;
  display: flex;
  flex-direction: column;
  width: auto;
  max-width: auto;
  margin: 0 auto;
  gap: 10px;
}

/* ==========================================================================
   3. BANNERS NOTIFICACIONES (FLOTANTES Y SUAVES)
   ========================================================================== */
.banners-wrapper {
  position: absolute;
  top: 52px;
  left: 50%;
  transform: translateX(-50%);
  width: 92%;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
}

.glass-banner {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.banner-info {
  background: rgba(14, 165, 233, 0.2);
  border-color: rgba(56, 189, 248, 0.4);
  color: #38bdf8;
}

.banner-warning {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}

.banner-danger {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
  color: #f87171;
}

.banner-accent {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.4);
  color: #c084fc;
}

.banner-neutral {
  background: rgba(75, 85, 99, 0.3);
  color: #e5e7eb;
}

.badge-timer {
  background: rgba(239, 68, 68, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.btn-banner-action {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-banner-action:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Animación Banners */
.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: all 0.3s ease;
}

.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* ==========================================================================
   4. BARRAS DE JUGADORES (USER PROFILES)
   ========================================================================== */
.player-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(22, 25, 35, 0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 8px 12px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.player-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.my-avatar {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.2);
}

.player-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.player-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #f3f4f6;
}

.badge-bot {
  font-size: 0.6rem;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.player-tag {
  font-size: 0.68rem;
  color: #6b7280;
  font-weight: 600;
}

.tag-rated {
  color: #38bdf8;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Selector de Tema */
.theme-select {
  background: rgba(15, 17, 23, 0.8);
  color: #9ca3af;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 4px 6px;
  font-size: 0.7rem;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-select:hover {
  border-color: #38bdf8;
  color: #fff;
}

/* Relojes */
.chess-clock {
  background: #16171d;
  color: #6b7280;
  font-family: 'JetBrains Mono', monospace, sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  min-width: 62px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.25s ease;
}

.clock-active {
  background: #ffffff !important;
  color: #0f1015 !important;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
  border-color: #ffffff;
}

.clock-warning {
  background: #ef4444 !important;
  color: #ffffff !important;
  animation: clock-pulse 0.6s infinite alternate;
}

@keyframes clock-pulse {
  from {
    opacity: 0.8;
    transform: scale(0.98);
  }

  to {
    opacity: 1;
    transform: scale(1.02);
  }
}

/* ==========================================================================
   5. TABLERO ENCAPSULADO
   ========================================================================== */
.board-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--border);
  background: #181a20;
  transition: opacity 0.3s;
}

.board-wrapper :deep(cg-board) {
  background-image: var(--board-bg) !important;
  background-size: cover !important;
}

.board-wrapper :deep(square.selected) {
  background-color: var(--selected) !important;
}

.board-wrapper :deep(square.last-move) {
  background-color: var(--last-move) !important;
}

.board-wrapper :deep(square.check) {
  background-color: var(--check) !important;
}

.board-wrapper :deep(square.move-dest) {
  background: radial-gradient(circle, var(--moveDot) 22%, transparent 23%);
}

.board-blocked {
  pointer-events: none;
  opacity: 0.9;
}

/* ==========================================================================
   6. PANEL DE ACCIONES Y BOTONES GLASS
   ========================================================================== */
.action-panel {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-glass {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: #f3f4f6;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-glass:hover:not(:disabled) {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.1);
}

.btn-glass-danger:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #f87171;
}

.btn-glass-warning:hover {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.5);
  color: #fbbf24;
}

.btn-glass-success {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.btn-glass-success:hover {
  background: rgba(34, 197, 94, 0.25);
}

.btn-glass-primary {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.btn-glass-accent {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
}

.btn-glass:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==========================================================================
   7. MODAL Y TARJETAS DE RESULTADO
   ========================================================================== */
.game-modal {
  position: fixed;
  inset: 0;
  background: rgba(8, 9, 12, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: 16px;
}

.modal-card {
  background: #14161f;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 360px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}

.modal-header h3 {
  margin: 0 0 12px 0;
  font-size: 1.3rem;
  font-weight: 800;
}

.title-rematch {
  color: #fbbf24;
}

.title-waiting {
  color: #38bdf8;
}

.title-ended {
  color: #f3f4f6;
}

.title-draw {
  color: #60a5fa;
}

.modal-message {
  font-size: 0.88rem;
  color: #9ca3af;
  margin-bottom: 16px;
}

.elo-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.elo-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.elo-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.elo-badge {
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.elo-plus {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.elo-minus {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.cta-box p {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn-link {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.78rem;
  cursor: pointer;
  padding: 6px;
  transition: color 0.2s;
}

.btn-link:hover {
  color: #f3f4f6;
}

.full-width {
  width: 100%;
}

/* Transición Modal */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Spinner */
.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .player-bar {
    padding: 6px 10px;
  }

  .avatar-box {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .player-name {
    font-size: 0.8rem;
  }

  .chess-clock {
    font-size: 0.95rem;
    min-width: 52px;
    padding: 3px 6px;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>