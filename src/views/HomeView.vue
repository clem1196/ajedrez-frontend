<!-- src/views/HomeView.vue -->
<template>
  <div class="home-container">
    <div class="card-welcome">
      <h1>¡Ajedrez CDB! ♟️</h1>
      
      <p class="subtitle">
        {{ authStore.isAuthenticated ? `Bienvenido de vuelta, ${authStore.currentNick}.` : 'Sin registros, sin rodeos. Ingresa tu nick y juega ya.' }}
      </p>

      <div v-if="!gameStore.isSearching && !gameStore.roomId" class="form-group">
        
        <input 
          v-if="!authStore.isAuthenticated"
          v-model="nickInput" 
          type="text" 
          placeholder="Tu Nick (Ej: Depredador10)" 
          class="input-nick"
          maxLength="15"
          @keyup.enter="handlePlay"
        />

        <div v-else class="auth-user-badge">
          <span class="user-avatar-big">👤</span>
          <div class="user-meta">
            <span class="user-nick">{{ authStore.currentNick }}</span>
            <span class="user-elo">Elo Competitivo: <strong>{{ authStore.currentElo }}</strong></span>
          </div>
          <div>
            <button class="btn-time-option"  @click="router.push('/profile/edit')">✏️</button>
          </div>
        </div>

        <div class="time-selector-container">
          <label class="time-label">Selecciona el Ritmo de Juego:</label>
          <div class="time-options">
            <button 
              type="button"
              class="btn-time-option" 
              :class="{ 'active': gameStore.selectedMinutes === 5 }" 
              @click="gameStore.selectedMinutes = 5"
            >⚡ 5 min</button>
            <button 
              type="button"
              class="btn-time-option" 
              :class="{ 'active': gameStore.selectedMinutes === 10 }" 
              @click="gameStore.selectedMinutes = 10"
            >⏳ 10 min</button>
            <button 
              type="button"
              class="btn-time-option" 
              :class="{ 'active': gameStore.selectedMinutes === 15 }" 
              @click="gameStore.selectedMinutes = 15"
            >🐢 15 min</button>
          </div>
        </div>
        
        <button class="btn-play-glass" @click="handlePlay">
          {{ authStore.isAuthenticated ? '🎮 NUEVA PARTIDA' : '¡JUGAR AHORA!' }}
        </button>
      </div>

      <div v-if="gameStore.isSearching" class="searching-status">
        <div class="spinner"></div>
        <p>Buscando un rival digno en línea...</p>
        <p class="player-info-queue">
          Tu nick: <strong>{{ authStore.user?.nick || gameStore.nick }}</strong> 
          ({{ authStore.user?.elo || gameStore.elo || 1200 }}) • Ritmo: <strong>{{ gameStore.selectedMinutes }} min</strong>
        </p>

        <button class="btn-danger-glass cancel-btn" @click="handleCancel" style="margin-top: 15px;">
          ❌ Cancelar Búsqueda
        </button>
      </div>

      <!-- ✅ Top Jugadores - Con tipos corregidos -->
      <div v-if="topPlayers.length > 0 && !gameStore.isSearching" class="top-players-section">
        <div class="top-players-header">
          <span class="top-players-title">🏆 Top Jugadores</span>
          <button class="view-all-btn" @click="goToRanking">Ver todos →</button>
        </div>
        <div class="top-players-list">
          <div 
            v-for="player in topPlayers" 
            :key="player.userId || player.id || player.rank" 
            class="top-player-item"
          >
            <span class="rank">
              <span v-if="player.rank === 1">🥇</span>
              <span v-else-if="player.rank === 2">🥈</span>
              <span v-else-if="player.rank === 3">🥉</span>
              <span v-else>#{{ player.rank }}</span>
            </span>
            <span class="nick">{{ player.nick }}</span>
            <span class="elo">{{ player.elo }} Elo</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore'; 
import { useRouter } from 'vue-router';
import api from '../services/api';

// ✅ Definir interfaz para TopPlayer
interface TopPlayer {
  id?: number;
  userId?: number;
  rank: number;
  nick: string;
  elo: number;
  wins?: number;
}

const gameStore = useGameStore();
const authStore = useAuthStore(); 
const router = useRouter();

const nickInput = ref(gameStore.nick || '');
const topPlayers = ref<TopPlayer[]>([]); // ✅ Tipado correcto
const loadingTop = ref(false);
let navigationGuard: (() => void) | null = null;

// 💡 Aseguramos un valor inicial por defecto en el Store
onMounted(async () => {
  if (!gameStore.selectedMinutes) {
    gameStore.selectedMinutes = 10;
  }
  
  // ✅ Si el usuario está autenticado pero no tiene nick en el store, sincronizar
  if (authStore.isAuthenticated && authStore.currentNick) {
    gameStore.nick = authStore.currentNick;
    gameStore.elo = authStore.currentElo;
  }

  // ✅ Cargar top jugadores
  await loadTopPlayers();
  // ✅ Limpiar sessionStorage de partidas antiguas si no estamos en una
  if (!gameStore.roomId) {
    sessionStorage.removeItem('game_room_id');
    sessionStorage.removeItem('game_player_nick');
    sessionStorage.removeItem('game_my_color');
  }
});

// ✅ Función para cargar top jugadores
const loadTopPlayers = async () => {
  loadingTop.value = true;
  try {
    const response = await api.get('/users/top', {
      params: { limit: 5 }
    });
    
    if (response.data && response.data.data) {
      topPlayers.value = response.data.data;
    }
  } catch (error) {
    console.error('Error cargando top jugadores:', error);
    // ✅ Fallback: datos de ejemplo si falla la API
    topPlayers.value = [];
  } finally {
    loadingTop.value = false;
  }
};

// ✅ Navegar al ranking
const goToRanking = () => {
  router.push('/ranking');
};

// ✅ Limpiar al desmontar
onUnmounted(() => {
  if (navigationGuard) {
    navigationGuard();
    navigationGuard = null;
  }
});

const handlePlay = () => {
  const targetMinutes = gameStore.selectedMinutes || 10;
  
  gameStore.cancelSearch();
  
  if (authStore.isAuthenticated) {
    gameStore.resetGame();
    sessionStorage.removeItem('game_room_id');
    sessionStorage.removeItem('game_player_nick');
    sessionStorage.removeItem('game_my_color');
    gameStore.searchGame(authStore.currentNick, authStore.currentElo, targetMinutes);
    return;
  }
  
  const cleanNick = nickInput.value.trim();
  if (!cleanNick) {
    alert('Por favor, ingresa un Nick válido antes de jugar.');
    return;
  }
  
  gameStore.resetGame();
  sessionStorage.removeItem('game_room_id');
  sessionStorage.removeItem('game_player_nick');
  sessionStorage.removeItem('game_my_color');
  gameStore.searchGame(cleanNick, 1200, targetMinutes);
};

const handleCancel = () => {
  gameStore.cancelSearch();
};

// ✅ Watch para redirigir cuando se crea una sala
watch(
  () => gameStore.roomId,
  (newRoomId) => {
    if (newRoomId) {
      console.log(`🚀 ¡Sala detectada! Redirigiendo al tablero: ${newRoomId}`);
      
      if (navigationGuard) {
        navigationGuard();
        navigationGuard = null;
      }
      
      router.push('/game');
    }
  }
);
</script>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: start;
  height: 100vh;
  background-color: #121214;
  color: #fff;
  font-family: sans-serif;
  padding: 20px;
  width: 500px;
}

.card-welcome {
  text-align: center;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  max-width: 480px;
  width: 100%;
}

h1 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #94a3b8;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-nick {
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 1.1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.input-nick:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
}

.input-nick::placeholder {
  color: #64748b;
}

/* ⏱️ Selector de Tiempo */
.time-selector-container {
  text-align: left;
}

.time-label {
  display: block;
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 8px;
  font-weight: 500;
}

.time-options {
  display: flex;
  gap: 10px;
}

.btn-time-option {
  flex: 1;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ccced1;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.btn-time-option:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-time-option.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  color: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
}

.btn-play-glass {
  display: block;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
  border: none;
  font-weight: bold;
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-play-glass:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);
}

.btn-play-glass:active {
  transform: translateY(0);
}

/* Estado de búsqueda */
.searching-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border-left-color: #2ecc71;
  animation: spin 1s linear infinite;
  margin: 0.5rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.player-info-queue {
  font-size: 0.9rem;
  color: #94a3b8;
}

.player-info-queue strong {
  color: #e2e8f0;
}

/* Badge de usuario autenticado */
.auth-user-badge {
  display: flex;
  align-items: flex-end;
  gap: 15px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 15px;
  border-radius: 12px;
  text-align: left;
  justify-content: space-between;
}

.user-avatar-big {
  font-size: 2rem;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-nick {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
}

.user-elo {
  font-size: 0.9rem;
  color: #38bdf8;
}

.btn-danger-glass {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
}

.btn-danger-glass:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 480px) {
  .card-welcome {
    padding: 1.5rem;
  }
  
  h1 {
    font-size: 1.4rem;
  }
  
  .time-options {
    flex-direction: column;
    gap: 6px;
  }
  
  .btn-time-option {
    padding: 8px;
    font-size: 0.8rem;
  }
  
  .btn-play-glass {
    font-size: 1rem;
    padding: 12px;
  }
  .top-player-item {
    padding: 4px 8px;
  }
  
  .top-player-item .rank {
    width: 24px;
    font-size: 0.75rem;
  }
  
  .top-player-item .nick {
    font-size: 0.8rem;
  }
  
  .top-player-item .elo {
    font-size: 0.75rem;
  }
}
.top-players-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.top-players-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.top-players-title {
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.view-all-btn {
  background: none;
  border: none;
  color: #38bdf8;
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 4px 8px;
  border-radius: 4px;
}

.view-all-btn:hover {
  color: #7dd3fc;
  background: rgba(56, 189, 248, 0.08);
}

.top-players-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.top-player-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: background 0.2s ease;
}

.top-player-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.top-player-item .rank {
  width: 32px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  text-align: center;
}

.top-player-item .nick {
  flex: 1;
  color: #e2e8f0;
  font-weight: 500;
  font-size: 0.9rem;
}

.top-player-item .elo {
  color: #38bdf8;
  font-weight: 600;
  font-size: 0.85rem;
}


</style>