<!--src/views/GameView.vue-->
<template>
    <div class="game-container">
        <div class="game-layout">
            <!-- ✅ Banner de reconexión (usa gameStore directamente) -->
            <div v-if="gameStore.isReconnecting" class="reconnecting-banner">
                <div class="reconnecting-content">
                    <div class="spinner-small"></div>
                    <span class="reconnecting-text">🔄 Reconectando...</span>
                </div>
            </div>

            <!-- ✅ Banner de desconexión del oponente -->
            <div v-if="gameStore.opponentDisconnected && !gameStore.isReconnecting" class="disconnection-banner">
                <span>⏳ {{ gameStore.opponentDisconnectedMessage }}</span>
                <div class="reconnection-timer" v-if="gameStore.reconnectionTime > 0">
                    <strong>{{ gameStore.reconnectionTime }}s</strong>
                </div>
            </div>

            <!-- ✅ Banner de partida pausada -->
            <div v-if="gameStore.isPaused && !gameStore.opponentDisconnected" class="paused-banner">
                <span>⏸️ Partida en pausa</span>
            </div>

            <!-- ✅ Banner AFK del oponente (usa gameStore.opponentAfkMessage) -->
            <div v-if="gameStore.opponentAfkMessage && !gameStore.afkWarning" class="afk-banner-glass">
                <div class="afk-info">
                    <span>⏳ {{ gameStore.opponentAfkMessage }}</span>
                </div>
            </div>

            <!-- ✅ Banner de advertencia AFK para ti (usa gameStore.afkWarning y afkCountdown) -->
            <div v-if="gameStore.afkWarning && !gameStore.gameEnded" class="afk-warning-banner-glass">
                <div class="afk-warning-info">
                    <span>⚠️ Tienes <strong>{{ gameStore.afkCountdown }}s</strong> para mover o perderás.</span>
                </div>
                <div class="afk-countdown" v-if="gameStore.afkCountdown > 0">
                    ⏱️ <strong>{{ gameStore.afkCountdown }}s</strong> restantes
                </div>
            </div>

            <!-- ⏱️ Banner de cortesía para el primer movimiento -->
            <div v-if="gameStore.moveCount === 0 && gameStore.myColor === 'w' && courtesyCountdown > 0"
                class="courtesy-badge-glass">
                <span>⏱️ Tiempo de cortesía: <strong>{{ courtesyCountdown }}s</strong></span>
            </div>

            <!-- ⏱️ Banner de advertencia de tiempo -->
            <div v-if="gameStore.gameStarted && !gameStore.gameEnded && isMyTurn && playerTimeWarning"
                class="time-warning-banner">
                ⚠️ ¡Poco tiempo! <strong>{{ formatTime(getCurrentPlayerTime()) }}</strong>
            </div>

            <!-- 📢 Banner de notificación de oferta de tablas -->
            <div v-if="drawOfferNotification" class="draw-offer-banner-glass">
                <span>🤝 Has enviado una propuesta de tablas a <strong>{{ gameStore.opponentNick }}</strong></span>
                <button class="btn-cancel-draw" @click="cancelDrawOffer">❌ Cancelar</button>
            </div>

            <!-- 👤 JUGADOR SUPERIOR (RIVAL) -->
            <div class="player-bar opponent-bar">
                <span class="player-avatar">♟️</span>
                <div class="player-info">
                    <span class="player-name">
                        {{ gameStore.opponentNick || 'Buscando rival...' }}
                        <span v-if="isBotOpponent" class="bot-badge">🤖 Bot</span>
                    </span>
                    <span class="player-tag" :class="{ 'tag-rated': gameStore.opponentNick }">
                        {{ gameStore.opponentNick ? `📈 Elo: ${gameStore.opponentElo}` : 'ESPERANDO' }}
                    </span>
                </div>
                <div class="chess-clock" :class="{
                    'clock-active': gameStore.gameStarted && !isMyTurn,
                    'clock-warning': gameStore.gameStarted && !isMyTurn && getOpponentTime() < 10
                }">
                    {{ formatTime(getOpponentTime()) }}
                </div>
            </div>

            <div class="board-wrapper"
                :class="{ 'board-blocked': (gameStore.gameStarted && !isMyTurn) || gameStore.gameEnded || gameStore.isPaused }">
                <TheChessboard :board-config="boardConfig" @board-created="handleBoardCreated"
                    @move="handleLocalMove" />
            </div>

            <!-- 👤 JUGADOR INFERIOR (TÚ) -->
            <div class="player-bar player-local-bar">
                <span class="player-avatar">👤</span>
                <div class="player-info">
                    <span class="player-name">{{ gameStore.nick }} (Tú)</span>
                    <span class="player-tag tag-rated">📈Elo: {{ gameStore.elo }}</span>
                </div>
                <div class="chess-clock" :class="{
                    'clock-active': gameStore.gameStarted && isMyTurn,
                    'clock-warning': gameStore.gameStarted && isMyTurn && getCurrentPlayerTime() < 10
                }">
                    {{ formatTime(getCurrentPlayerTime()) }}
                </div>
            </div>

            <div class="action-panel" v-if="!gameStore.gameEnded">
                <template v-if="gameStore.moveCount <= 1">
                    <button class="btn-action btn-abort" @click="gameStore.abortGame">⏱️ Abortar Partida</button>
                </template>
                <template v-else>
                    <button class="btn-action btn-surrender" @click="surrender">🏳️ Abandonar</button>
                    <button class="btn-action btn-draw" @click="offerDraw" :disabled="drawOfferPending">
                        🤝 {{ drawOfferPending ? '⏳ Esperando respuesta...' : 'Ofrecer Tablas' }}
                    </button>
                </template>
            </div>

            <!-- 🪟 MODAL DE EVENTOS Y FIN DE PARTIDA -->
            <div class="game-modal"
                v-if="gameStore.drawOfferedByOpponent || gameStore.gameEnded || gameStore.rematchOfferedByOpponent || gameStore.iRequestedRematch">
                <div class="modal-content text-center">
                    <h3 v-if="gameStore.rematchOfferedByOpponent" class="modal-title-rematch">🔥 ¡Reto Recibido!</h3>
                    <h3 v-else-if="gameStore.iRequestedRematch" class="modal-title-waiting">⌛ Desafío Enviado</h3>
                    <h3 v-else-if="gameStore.gameEnded" class="modal-title-ended">
                        {{ gameStore.endGameMessage.includes('Abortada') ? 'Aviso de la Sala' : 'Fin de la Partida' }}
                    </h3>
                    <h3 v-else>¡Propuesta de Tablas!</h3>

                    <p class="modal-message">
                        <template v-if="gameStore.rematchOfferedByOpponent">
                            <strong>{{ gameStore.opponentNick }}</strong> te ofrece una revancha directa con colores
                            invertidos.
                        </template>
                        <template v-else-if="gameStore.iRequestedRematch">
                            Esperando que <strong>{{ gameStore.opponentNick }}</strong> acepte o rechace la revancha...
                        </template>
                        <template v-else>
                            {{ gameStore.gameEnded ? gameStore.endGameMessage : `Tu oponente te ofrece declarar un
                            empate.` }}
                        </template>
                    </p>

                    <div v-if="gameStore.gameEnded && !gameStore.endGameMessage.includes('Abortada')"
                        class="elo-summary-box">
                        <div class="elo-row-user">
                            <span class="user-label">🏆 {{ gameStore.nick }} (Tú):</span>
                            <span class="elo-badge" :class="myVisualEloChange >= 0 ? 'elo-positive' : 'elo-negative'">
                                {{ myVisualEloChange >= 0 ? `+${myVisualEloChange}` : myVisualEloChange }} Elo
                            </span>
                        </div>
                        <div class="elo-row-opponent">
                            <span class="opponent-label">⚔️ {{ gameStore.opponentNick || 'Oponente' }}:</span>
                            <span class="elo-badge"
                                :class="opponentVisualEloChange >= 0 ? 'elo-positive' : 'elo-negative'">
                                {{ opponentVisualEloChange >= 0 ? `+${opponentVisualEloChange}` :
                                    opponentVisualEloChange }} Elo
                            </span>
                        </div>
                    </div>

                    <div v-if="gameStore.gameEnded && !gameStore.iRequestedRematch && !gameStore.rematchOfferedByOpponent"
                        class="post-game-box">
                        <hr class="modal-divider" />
                        <p class="cta-text">
                            <template v-if="authStore.isAuthenticated">
                                ¿Deseas jugar otra partida o prefieres volver al inicio?
                            </template>
                            <template v-else>
                                ¿Deseas seguir jugando o prefieres registrarte para guardar tu puntaje?
                            </template>
                        </p>
                    </div>

                    <div class="modal-buttons">
                        <template v-if="gameStore.drawOfferedByOpponent && !gameStore.gameEnded">
                            <div class="endgame-action-row">
                                <button class="btn-modal-yes" @click="acceptDraw">🤝 Aceptar Tablas</button>
                                <button class="btn-modal-no" @click="gameStore.drawOfferedByOpponent = false">❌
                                    Rechazar</button>
                            </div>
                        </template>
                        <template v-else-if="gameStore.iRequestedRematch">
                            <div class="spinner-small"></div>
                            <button class="btn-modal-no" @click="cancelRematch" style="width: 100%;">❌ Cancelar
                                Solicitud</button>
                        </template>
                        <template v-else-if="gameStore.rematchOfferedByOpponent">
                            <div class="endgame-action-row">
                                <button class="btn-modal-yes" @click="acceptRematch">⚔️ Aceptar Revancha</button>
                                <button class="btn-modal-no" @click="declineRematch">Rechazar</button>
                            </div>
                        </template>
                        <template v-else>
                            <div class="endgame-action-row">
                                <button v-if="!gameStore.endGameMessage.includes('Abortada')" class="btn-modal-rematch"
                                    :class="{ 'half-width': authStore.isAuthenticated }" @click="requestRematch">
                                    ⚔️ Pedir Revancha
                                </button>

                                <button v-if="gameStore.endGameMessage.includes('Abortada')" class="btn-modal-rematch"
                                    :class="{ 'half-width': authStore.isAuthenticated }" @click="rematchGame">
                                    🔄 Jugar Otra Vez
                                </button>

                                <button v-else-if="gameStore.rematchDeclinedByOpponent" class="btn-modal-rematch"
                                    :class="{ 'half-width': authStore.isAuthenticated }" @click="rematchGame">
                                    🔍 Buscar Nueva Partida
                                </button>

                                <button v-if="authStore.isAuthenticated" class="btn-modal-new-game" @click="handlePlay">
                                    🎮 Nueva Partida
                                </button>

                                <button v-if="!authStore.isAuthenticated" class="btn-modal-register"
                                    @click="goToRegister">
                                    💎 Registrar Cuenta
                                </button>
                            </div>

                            <button class="btn-modal-close-link" @click="exitGame">
                                Volver al Menú Principal
                            </button>
                        </template>
                    </div>
                </div>
            </div>
        </div>
        <GameChat />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { socket } from '../services/socketService';
import { BoardApi, TheChessboard } from 'vue3-chessboard';
import GameChat from '../components/GameChat.vue';
import 'vue3-chessboard/style.css';
import router from '@/router';
import { Chess } from 'chess.js';
import type { Key } from 'chessground/types';

const gameStore = useGameStore();
const authStore = useAuthStore();

// ✅ Estado local SOLO para UI que no necesita estar en el store global
const drawOfferPending = ref(false);
const drawOfferNotification = ref(false);
const courtesyCountdown = ref(60);
let courtesyInterval: ReturnType<typeof setInterval> | null = null;
const boardKey = ref(0);
const boardAPI = ref<BoardApi | null>(null);
const shouldAnimate = ref(true);


// ✅ Computed properties que leen directamente del store (Single Source of Truth)
const isBotOpponent = computed(() => gameStore.isBotOpponent);
const currentTurnColor = computed(() => (gameStore.currentFen.split(' ')[1] === 'b' ? 'black' : 'white') as "white" | "black");

const isMyTurn = computed(() => {
    if (!gameStore.gameStarted || gameStore.gameEnded) return false;
    const myColorFull = gameStore.myColor === 'w' ? 'white' : 'black';
    return currentTurnColor.value === myColorFull;
});
function handleBoardCreated(api: BoardApi) {
    boardAPI.value = api;
}
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

        // Obtenemos todos los movimientos válidos y los agrupamos por casilla de origen
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

    // 1. Si el store lo maneja como un string plano (ej. "g8f6")
    if (typeof rawMove === 'string' && rawMove.length === 4) {
        return [
            rawMove.substring(0, 2) as Key,
            rawMove.substring(2, 4) as Key
        ] as [Key, Key];
    }

    // 2. Si el store lo maneja como un array (ej. ['g8', 'f6'])
    if (Array.isArray(rawMove) && rawMove.length === 2) {
        return [
            String(rawMove[0]) as Key,
            String(rawMove[1]) as Key
        ] as [Key, Key];
    }

    return undefined;
});
const boardConfig = computed(() => {
    const myColorFull: "white" | "black" = gameStore.myColor === 'w' ? 'white' : 'black';
    const canIMove = !gameStore.gameEnded &&
        !gameStore.isPaused &&
        ((gameStore.moveCount === 0 && gameStore.myColor === 'w') || isMyTurn.value);

    return {
        coordinates: true,
        fen: gameStore.currentFen,
        orientation: myColorFull,
        turnColor: currentTurnColor.value,
        // 👇 Pasamos el movimiento formateado que forzará el resaltado
        lastMove: formattedLastMove.value,

        animation: { enabled: shouldAnimate.value, duration: 200 },
        movable: {
            color: canIMove ? myColorFull : undefined,
            free: false,
            dests: canIMove ? getDests(gameStore.currentFen) : new Map(),
        },
        draggable: {
            enabled: canIMove
        }
    };
});

const startCourtesyTimer = () => {
    // ✅ Verificamos explícitamente que no sea null
    if (courtesyInterval !== null) {
        clearInterval(courtesyInterval);
        courtesyInterval = null;
    }

    courtesyCountdown.value = 60;

    courtesyInterval = setInterval(() => {
        if (courtesyCountdown.value > 0) {
            courtesyCountdown.value--;
        } else {
            stopCourtesyTimer(); // ✅ Reutilizamos la función de limpieza

            if (gameStore.moveCount === 0 && gameStore.myColor === 'w') {
                console.log("⏱️ Tiempo de cortesía agotado visualmente.");
            }
        }
    }, 1000);
};

// ✅ 3. Función de parada segura
const stopCourtesyTimer = () => {
    if (courtesyInterval !== null) {
        clearInterval(courtesyInterval);
        courtesyInterval = null;
    }
};

// 🎯 Manejar movimiento local
const handleLocalMove = (moveInfo: any) => {
    if (gameStore.gameEnded || gameStore.isPaused || gameStore.drawOfferedByOpponent) return;

    const turnInStore = gameStore.currentFen.split(' ')[1];
    if (turnInStore !== gameStore.myColor) {
        console.warn("[Anti-Cheat] No es tu turno de mover.");
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

    stopCourtesyTimer(); // Detener cortesía visual al mover
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

    // Auto-cancelar oferta visualmente después de 30s si no hay respuesta
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
    socket.emit('decline_rematch', { roomId: gameStore.roomId });
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
// ⏱️ Formateador de tiempo (MM:SS)
const formatTime = (seconds: number): string => {
    if (!gameStore.gameStarted) {
        const initialMinutes = gameStore.selectedMinutes;
        return `${initialMinutes.toString().padStart(2, '0')}:00`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 💡 Computed para mostrar cambios de Elo visualmente
const myVisualEloChange = computed(() => {
    if (gameStore.eloChange !== 0) return gameStore.eloChange;
    const msg = gameStore.endGameMessage.toLowerCase();
    if (msg.includes('tablas') || msg.includes('empate') || msg.includes('abortada')) return 0;
    // Si no hay datos de Elo, asumimos victoria/derrota según el mensaje
    if (msg.includes('victoria') || msg.includes('gana')) return 16;
    if (msg.includes('derrota') || msg.includes('pierde')) return -16;
    return 0;
});

const opponentVisualEloChange = computed(() => {
    if (gameStore.opponentEloChange !== 0) return gameStore.opponentEloChange;
    return -myVisualEloChange.value;
});

// 🎮 Función para "Nueva Partida" (usuarios autenticados)
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
// ✅ Watchers para reaccionar a cambios del store (En lugar de socket.on duplicados)
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
    }
});
watch(
    () => gameStore.currentFen,
    (newFen, oldFen) => {
        if (!boardAPI.value || !newFen || !oldFen) {
            return;
        }

        const turn = newFen.split(" ")[1];

        const isOpponentMove = turn === gameStore.myColor;

        if (isOpponentMove) {
            // ✅ setConfig permite pasar fen + lastMove juntos, así el
            // tablero resalta la casilla de origen/destino del oponente.
            // (setPosition solo acepta el fen y por eso el resaltado se perdía)
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
// ✅ Detectar recarga de página
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
        // El socketService.ts se encargará de emitir 'reconnect_to_room' al conectarse
        if (!socket.connected) {
            socket.connect();
        }
    }
});

onMounted(() => {
    if (gameStore.moveCount === 0 && gameStore.myColor === 'w') {
        startCourtesyTimer();
    }
});

onUnmounted(() => {
    // ✅ SOLO limpiamos timers locales. NUNCA uses socket.off() aquí.
    stopCourtesyTimer();
});
</script>

<style scoped>
.bot-badge {
    font-size: 0.65rem;
    background: rgba(56, 189, 248, 0.15);
    padding: 1px 8px;
    border-radius: 4px;
    margin-left: 6px;
    color: #38bdf8;
    font-weight: 500;
    border: 1px solid rgba(56, 189, 248, 0.2);
}

.bot-elo-tag {
    font-size: 0.6rem;
    color: #38bdf8;
    margin-left: 4px;
    opacity: 0.7;
}

@keyframes pulse-bot {

    0%,
    100% {
        opacity: 0.7;
    }

    50% {
        opacity: 1;
        transform: scale(1.05);
    }
}

/* ✅ Estilos para banners de reconexión */
.reconnecting-banner {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 40;
    display: flex;
    align-items: baseline;
    gap: 4px;
    padding: 12px 24px;
    background: rgba(56, 189, 248, 0.25);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 2px solid rgba(56, 189, 248, 0.5);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(56, 189, 248, 0.2);
    min-width: 280px;
    animation: slideDown 0.4s ease, pulse-reconnect 1.5s infinite alternate;
}

.reconnecting-content {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: center;
}

.reconnecting-text {
    color: #38bdf8;
    font-weight: 600;
    font-size: 0.95rem;
}

.reconnecting-countdown {
    color: #ff6b6b;
    font-weight: 700;
    font-size: 1.1rem;
    background: rgba(255, 0, 0, 0.15);
    padding: 2px 10px;
    border-radius: 4px;
    border: 1px solid rgba(255, 0, 0, 0.2);
    min-width: 30px;
    text-align: center;
}

.reconnecting-progress {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #38bdf8, #ff6b6b);
    border-radius: 2px;
    transition: width 0.3s ease;
}

.disconnection-banner {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 20px;
    background: rgba(255, 165, 0, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 165, 0, 0.4);
    border-radius: 8px;
    color: #ffa500;
    font-weight: 500;
    font-size: 0.9rem;
    animation: slideDown 0.4s ease;
}

.paused-banner {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 20px;
    background: rgba(100, 100, 100, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid rgba(100, 100, 100, 0.3);
    border-radius: 8px;
    color: #94a3b8;
    font-weight: 500;
    font-size: 0.9rem;
    animation: slideDown 0.4s ease;
}

.reconnection-timer {
    color: #ff6b6b;
    font-weight: 700;
    font-size: 1.1rem;
    background: rgba(255, 0, 0, 0.1);
    padding: 2px 10px;
    border-radius: 4px;
    border: 1px solid rgba(255, 0, 0, 0.2);
}

.spinner-small {
    border: 3px solid rgba(255, 255, 255, 0.1);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border-left-color: #38bdf8;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes slideDown {
    from {
        top: -50px;
        opacity: 0;
        transform: translateX(-50%) scale(0.9);
    }

    to {
        top: 8px;
        opacity: 1;
        transform: translateX(-50%) scale(1);
    }
}

@keyframes pulse-reconnect {
    0% {
        box-shadow: 0 8px 32px rgba(56, 189, 248, 0.1);
    }

    100% {
        box-shadow: 0 8px 32px rgba(56, 189, 248, 0.3);
    }
}

/* ✅ Nuevos estilos de estado */
.status-reconnecting {
    background: rgba(56, 189, 248, 0.2);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #38bdf8;
    animation: pulse-reconnect 1.5s infinite alternate;
}

.status-success {
    background: rgba(46, 204, 113, 0.2);
    border: 1px solid rgba(46, 204, 113, 0.3);
    color: #2ecc71;
}

.status-error {
    background: rgba(255, 60, 60, 0.2);
    border: 1px solid rgba(255, 60, 60, 0.3);
    color: #ff6b6b;
}

.status-info {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.2);
    color: #38bdf8;
}

/* ✅ Contenedor principal con padding para la barra de menú */
.game-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #121214;
    color: white;
    position: relative;
    padding-top: 10px;
    overflow-y: auto;
}

.game-layout {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: min(480px, 62vh);
    padding: 10px;
    margin: 0 auto;
    position: relative;
}

/* ✅ BANNER AFK - Jugador que espera */
.afk-banner-glass {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 14px;
    background: rgba(255, 165, 0, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 165, 0, 0.4);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    width: auto;
    max-width: 92%;
    min-height: 32px;
    pointer-events: none;
    white-space: nowrap;
}

.afk-info {
    color: #ffa500;
    font-weight: 500;
    font-size: 0.85rem;
    text-align: center;
    padding: 2px 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

/* ✅ BANNER AFK - Jugador que está demorando */
.afk-warning-banner-glass {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: rgba(255, 60, 60, 0.25);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 60, 60, 0.5);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(255, 0, 0, 0.3);
    animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), pulse-warning 1s infinite alternate;
    width: auto;
    max-width: 92%;
    min-height: 32px;
    pointer-events: none;
    flex-wrap: wrap;
    /* ✅ Permite que el contenido se envuelva si es necesario */
    justify-content: center;
}

.afk-warning-info {
    color: #ff6b6b;
    font-weight: 500;
    font-size: 0.85rem;
    text-align: center;
    padding: 2px 4px;
    white-space: nowrap;
}

.afk-countdown {
    color: #ff3333;
    font-weight: 700;
    font-size: 0.85rem;
    background: rgba(255, 0, 0, 0.15);
    padding: 1px 8px;
    border-radius: 4px;
    border: 1px solid rgba(255, 0, 0, 0.3);
    white-space: nowrap;
    flex-shrink: 0;
}

.afk-countdown strong {
    color: #ff0000;
    font-size: 0.95rem;
}

/* ✅ Banner de cortesía */
.courtesy-badge-glass {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 25;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    font-size: 0.75rem;
    color: #ff9f43;
    background: rgba(255, 159, 67, 0.15);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 159, 67, 0.3);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: pulse-subtle 2s infinite ease-in-out;
    pointer-events: none;
    white-space: nowrap;
}

@media (max-width: 768px) {
    .courtesy-badge-glass {
        font-size: 0.65rem;
        padding: 3px 8px;
        top: 4px;
    }
}

.courtesy-badge-glass strong {
    color: #ff5252;
}

/* ✅ Banner de advertencia de tiempo */
.time-warning-banner {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 25;
    padding: 5px 14px;
    background: rgba(255, 60, 60, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 60, 60, 0.4);
    border-radius: 6px;
    color: #ff6b6b;
    font-weight: 600;
    font-size: 0.8rem;
}

/* Resalto de la última jugada (Verde oliva translúcido estilo Lichess) */
:deep(.cg-wrap square.last-move) {
    background-color: rgba(155, 199, 0, 0.41) !important;
}

/* Resalto del rey en jaque (Gradiente rojo difuminado) */
:deep(.cg-wrap square.check) {
    background: radial-gradient(ellipse at center, rgba(255, 0, 0, 0.65) 0%, rgba(255, 0, 0, 0) 70%) !important;
}

/* Resalto de casilla seleccionada al hacer click en una pieza */
:deep(.cg-wrap square.selected) {
    background-color: rgba(20, 85, 30, 0.5) !important;
}

/* Destinos posibles (puntos de movimiento) */
:deep(.cg-wrap g.dots circle) {
    fill: rgba(20, 85, 30, 0.3) !important;
}

/* Destinos posibles sobre piezas que puedes capturar (aro alrededor de la pieza) */
:deep(.cg-wrap g.dots circle.capture) {
    stroke: rgba(20, 85, 30, 0.6) !important;
    stroke-width: 0.0625;
    fill: none !important;
}

@media (max-width: 768px) {
    .time-warning-banner {
        font-size: 0.7rem;
        padding: 4px 10px;
        top: 4px;
    }
}

.time-warning-banner strong {
    color: #ff3333;
}

/* ✅ Banner de oferta de tablas */
.draw-offer-banner-glass {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 25;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 14px;
    background: rgba(52, 152, 219, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(52, 152, 219, 0.3);
    border-radius: 8px;
    color: #3498db;
    font-size: 0.8rem;
    animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    white-space: nowrap;
    flex-wrap: wrap;
    justify-content: center;
}

.draw-offer-banner-glass strong {
    color: #5dade2;
}

@media (max-width: 768px) {
    .draw-offer-banner-glass {
        font-size: 0.7rem;
        padding: 4px 10px;
        top: 4px;
        gap: 4px;
    }

    .btn-cancel-draw {
        font-size: 0.65rem;
        padding: 2px 6px;
    }
}

.btn-cancel-draw {
    background: rgba(255, 60, 60, 0.15);
    border: 1px solid rgba(255, 60, 60, 0.3);
    color: #ff6b6b;
    padding: 2px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.2s ease;
    pointer-events: auto;
}

.btn-cancel-draw:hover {
    background: rgba(255, 60, 60, 0.25);
    transform: scale(1.05);
}

/* ✅ Barra del oponente (superior) */
.opponent-bar {
    margin-top: 34px;
    /* ✅ Espacio para los banners */
    position: relative;
    z-index: 5;
}

@media (max-width: 480px) {
    .opponent-bar {
        margin-top: 28px;
    }
}

/* ✅ Barra del jugador local (inferior) */
.player-local-bar {
    margin-bottom: 0;
    position: relative;
    z-index: 5;
}

/* ✅ Wrapper del tablero */
.board-wrapper {
    width: 100%;
    aspect-ratio: 1 / 1;
    margin: 8px 0;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    border-radius: 8px;
    overflow: visible;
    background: #1e1e24;
    position: relative;
    z-index: 5;
}

.board-wrapper :deep(.vue3-chessboard),
.board-wrapper :deep(.cg-wrap) {
    max-width: 100%;
    max-height: 100%;
}

/* ✅ Panel de acciones */
.action-panel {
    display: flex;
    gap: 12px;
    margin-top: 12px;
    margin-bottom: 10px;
    justify-content: center;
    position: relative;
    z-index: 5;
    flex-wrap: wrap;
    /* ✅ Permite que los botones se envuelvan en pantallas pequeñas */
    width: 100%;
    padding: 4px 0;
}

/* ✅ Escudo CSS para tablero bloqueado */
.board-blocked {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.95;
}

/* ✅ Barras de jugadores */
.player-bar {
    display: flex;
    align-items: flex-end;
    background: rgba(255, 255, 255, 0.05);
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    margin-top: auto;
}

.player-avatar {
    font-size: 1.5rem;
    margin-right: 12px;
}

.player-info {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px 8px;
}

.player-name {
    font-weight: bold;
    font-size: 1rem;
}

.player-tag {
    font-size: 0.75rem;
    color: #a0a0a0;
}

.player-tag.tag-rated {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #38bdf8;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
}

/* ✅ Estados de los mensajes de estado */
.opponent-status,
.local-status {
    font-size: 0.65rem;
    padding: 1px 8px;
    border-radius: 4px;
    font-weight: 500;
    white-space: nowrap;
    animation: fadeInStatus 0.3s ease;
}

.status-warning {
    background: rgba(255, 60, 60, 0.2);
    border: 1px solid rgba(255, 60, 60, 0.3);
    color: #ff6b6b;
    animation: pulse-warning 1s infinite alternate;
}

.status-afk {
    background: rgba(255, 60, 60, 0.2);
    border: 1px solid rgba(255, 60, 60, 0.3);
    color: #ff6b6b;
    animation: pulse-warning 1s infinite alternate;
}

.status-draw-offer {
    background: rgba(52, 152, 219, 0.2);
    border: 1px solid rgba(52, 152, 219, 0.3);
    color: #3498db;
}

.status-draw-accepted {
    background: rgba(46, 204, 113, 0.2);
    border: 1px solid rgba(46, 204, 113, 0.3);
    color: #2ecc71;
}

/* ✅ Relojes */
.chess-clock {
    background: #262421;
    color: #bababa;
    font-family: monospace;
    font-size: 1.2rem;
    font-weight: bold;
    padding: 4px 10px;
    border-radius: 4px;
    margin-left: 4px;
    border: 1px solid #403c35;
    min-width: 60px;
    text-align: center;
}

.clock-active {
    background: #fff !important;
    color: #000 !important;
    border-color: #fff;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.chess-clock.clock-warning {
    background: #ff3333 !important;
    color: #ffffff !important;
    border-color: #ff0000;
    animation: clock-flash 0.5s infinite alternate;
}

/* ✅ Botones de acción */
.btn-action {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 0.9rem;
    min-width: 120px;
    /* ✅ Ancho mínimo para que se vean bien */
    text-align: center;
    flex: 0 1 auto;
    /* ✅ No se estiran más de lo necesario */
}

.btn-surrender:hover {
    background: rgba(239, 83, 80, 0.2);
    border-color: #ef5350;
    color: #ef5350;
}

.btn-draw:hover {
    background: rgba(255, 167, 38, 0.2);
    border-color: #ffa726;
    color: #ffa726;
}

/* ✅ Animaciones */
@keyframes slideDown {
    from {
        top: -30px;
        opacity: 0;
        transform: translateX(-50%) scale(0.9);
    }

    to {
        top: 8px;
        opacity: 1;
        transform: translateX(-50%) scale(1);
    }
}

@keyframes pulse-warning {
    0% {
        opacity: 0.7;
        transform: translateX(-50%) scale(0.98);
    }

    100% {
        opacity: 1;
        transform: translateX(-50%) scale(1.02);
    }
}

@keyframes pulse-subtle {

    0%,
    100% {
        opacity: 0.9;
    }

    50% {
        opacity: 1;
        transform: scale(1.02);
    }
}

@keyframes fadeInStatus {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes clock-flash {
    0% {
        opacity: 0.7;
    }

    100% {
        opacity: 1;
    }
}

/* ✅ MODAL */
.game-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
}

.modal-content {
    background: #262421;
    border: 1px solid #403c35;
    padding: 25px;
    border-radius: 8px;
    text-align: center;
    color: white;
    max-width: 350px;
}

.modal-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
    flex-wrap: wrap;
}

.modal-buttons button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    font-weight: bold;
    cursor: pointer;
}

.modal-title-rematch {
    color: #f1c40f;
    font-size: 1.6rem;
}

.modal-title-waiting {
    color: #3498db;
    font-size: 1.6rem;
}

.spinner-small {
    border: 3px solid rgba(255, 255, 255, 0.1);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border-left-color: #3498db;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.btn-modal-rematch {
    background: linear-gradient(135deg, #28a745, #218838);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
    flex: 1;
}

.btn-modal-register {
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
    flex: 1;
}

.btn-modal-rematch:hover,
.btn-modal-register:hover {
    transform: translateY(-2px);
}

.btn-modal-yes {
    background: #4caf50;
    color: white;
}

.btn-modal-no {
    background: #f44336;
    color: white;
}

.btn-modal-close {
    background: #2196f3;
    color: white;
}

.btn-modal-close-link {
    background: #1b1b1b;
    color: #aaa;
    border: none;
    text-decoration: none;
    cursor: pointer;
    font-size: 0.9rem;
}

.btn-modal-close-link:hover {
    color: white;
}

.endgame-action-row {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 15px;
    width: 100%;
    flex-wrap: wrap;
}

.cta-text {
    font-size: 1rem;
    color: #e0e0e0;
    margin: 15px 0;
    font-weight: 500;
}

.modal-divider {
    border: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
    margin: 10px 0;
}

/* ✅ ELO */
.elo-summary-box {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 14px;
    margin: 18px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.elo-row-user,
.elo-row-opponent {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95rem;
}

.user-label {
    color: #e2e8f0;
    font-weight: 500;
}

.opponent-label {
    color: #94a3b8;
}

.elo-badge {
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.9rem;
}

.elo-positive {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #4ade80;
}

.elo-negative {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
}

/* ✅ Responsive para móviles */
@media (max-width: 768px) {
    .game-container {
        padding-top: 60px;
    }

    .afk-banner-glass,
    .afk-warning-banner-glass,
    .courtesy-badge-glass,
    .draw-offer-banner-glass,
    .time-warning-banner {
        top: 4px;
        padding: 4px 10px;
        font-size: 0.7rem;
        min-height: 26px;
        max-width: 95%;
    }

    .afk-countdown {
        font-size: 0.75rem;
        padding: 1px 6px;
    }

    .afk-countdown strong {
        font-size: 0.8rem;
    }

    .afk-info,
    .afk-warning-info {
        font-size: 0.7rem;
    }

    .opponent-bar {
        margin-top: 34px;
    }

    .board-wrapper {
        margin: 4px 0;
    }

    .opponent-bar,
    .player-local-bar {
        padding: 6px 10px;
    }

    .chess-clock {
        font-size: 1rem;
        padding: 3px 8px;
        min-width: 50px;
    }

    .player-name {
        font-size: 0.85rem;
    }

    .player-tag {
        font-size: 0.65rem;
    }

    .btn-action {
        padding: 6px 12px;
        font-size: 0.7rem;
    }

    .game-modal .modal-content {
        max-width: 90%;
        padding: 20px;
    }
}

@media (max-width: 480px) {

    .afk-banner-glass,
    .afk-warning-banner-glass {
        top: 4px;
        padding: 3px 8px;
        min-height: 24px;
        max-width: 98%;
        border-radius: 4px;
    }

    .afk-info {
        font-size: 0.65rem;
    }

    .afk-warning-info {
        font-size: 0.65rem;
    }

    .afk-countdown {
        font-size: 0.65rem;
        padding: 1px 4px;
    }

    .afk-countdown strong {
        font-size: 0.7rem;
    }

    .game-container {
        padding-top: 50px;
    }

    .opponent-bar {
        margin-top: 30px;
    }

    .player-info {
        gap: 2px 4px;
    }

    .opponent-status,
    .local-status {
        font-size: 0.55rem;
        padding: 1px 4px;
    }

    .chess-clock {
        font-size: 0.85rem;
        padding: 2px 6px;
        min-width: 40px;
    }
}

/* ✅ Orientación landscape */
@media (orientation: landscape) {
    .main-wrap {
        width: 60vh;
        margin-inline: auto;
        max-width: 700px;
    }
}

/* ✅ Utilidades */
.btn-modal-rematch.half-width {
    flex: 1;
    width: 50%;
}

.btn-modal-new-game {
    flex: 1;
    width: 50%;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #10b981;
    padding: 10px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-modal-new-game:hover {
    background: rgba(16, 185, 129, 0.25);
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
    transform: translateY(-1px);
}

.btn-success-glass {
    background: rgba(46, 204, 113, 0.2);
    border: 1px solid rgba(46, 204, 113, 0.4);
    color: #2ecc71;
    padding: 6px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
}

.btn-success-glass:hover {
    background: rgba(46, 204, 113, 0.3);
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(46, 204, 113, 0.2);
}

.my-color-indicator {
    font-size: 0.9rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 4px 10px;
    border-radius: 4px;
}
</style>