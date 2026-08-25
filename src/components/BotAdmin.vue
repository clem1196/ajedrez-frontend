<!-- src/components/BotAdmin.vue -->
<template>
  <div class="bot-admin-container">
    <div class="bot-admin-card glass-card">
      <div class="admin-header">
        <h2>🤖 Configuración de Bots</h2>
        <p class="admin-subtitle">Controla el comportamiento de los bots en el sistema</p>
      </div>

      <div class="admin-section">
        <div class="toggle-container">
          <label class="toggle-label">
            <span class="toggle-text">Activar Bots</span>
            <div class="toggle-switch" :class="{ active: botsEnabled }" @click="toggleBots">
              <span class="toggle-slider"></span>
            </div>
          </label>
          <span class="toggle-status" :class="{ active: botsEnabled }">
            {{ botsEnabled ? '✅ Activado' : '❌ Desactivado' }}
          </span>
        </div>

        <!-- 👇 Sección de dificultad ELIMINADA -->

        <div class="config-slider">
          <label class="slider-label">
            <span>Probabilidad de Bot:</span>
            <span class="slider-value">{{ botProbability }}%</span>
          </label>
          <input type="range" v-model.number="botProbability" min="0" max="100" class="slider-input"
            @change="updateConfig" />
          <span class="slider-hint">0% = Sin bots, 100% = Siempre bots</span>
        </div>

        <div class="config-slider">
          <label class="slider-label">
            <span>Mínimo jugadores para desactivar bots:</span>
            <span class="slider-value">{{ minPlayersToDisable }}</span>
          </label>
          <input type="range" v-model.number="minPlayersToDisable" min="0" max="20" class="slider-input"
            @change="updateConfig" />
          <span class="slider-hint">Si hay más de {{ minPlayersToDisable }} jugadores en cola, no se usan bots</span>
        </div>
      </div>

      <div class="admin-stats">
        <h3>📊 Estadísticas de Bots</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Bots activos:</span>
            <span class="stat-value">{{ botStats.active }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total de bots:</span>
            <span class="stat-value">{{ botStats.total }}</span>
          </div>
          <div class="stat-item" v-if="botStats.names && botStats.names.length > 0">
            <span class="stat-label">Nombres de bots activos:</span>
            <span class="stat-value">{{ botStats.names.join(', ') }}</span>
          </div>
        </div>
      </div>

      <div class="admin-actions">
        <button class="btn-refresh" @click="loadStats">🔄 Actualizar</button>
        <button class="btn-reset" @click="resetConfig">🔁 Restaurar</button>
        <button class="btn-accept" @click="showConfirmModal = true">✅ Aceptar</button>
      </div>
    </div>

    <!-- Modal de confirmación (sin cambios) -->
    <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
      <div class="modal-content">
        <h3>💾 Guardar configuración</h3>
        <p>¿Deseas guardar los cambios realizados en la configuración de bots?</p>
        <div class="modal-actions">
          <button class="btn-modal-cancel" @click="showConfirmModal = false">
            ❌ Cancelar
          </button>
          <button class="btn-modal-confirm" @click="confirmAccept" :disabled="saving">
            {{ saving ? '⏳ Guardando...' : '✅ Sí, guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { useRouter } from 'vue-router';

const router = useRouter();

// ✅ Estado local
const botsEnabled = ref(true);
const botProbability = ref(100);
const minPlayersToDisable = ref(5);
const botStats = ref({ total: 0, active: 0, names: [] as string[] });
const loading = ref(false);
const saving = ref(false);
const showConfirmModal = ref(false);

// ✅ Funciones
const toggleBots = () => {
  botsEnabled.value = !botsEnabled.value;
};

const updateConfig = async () => {
  try {
    await api.post('/admin/bot-config', {
      enabled: botsEnabled.value,
      botProbability: botProbability.value,
      minPlayersToDisable: minPlayersToDisable.value
      // 👈 ya no se envía difficulty
    });
    return true;
  } catch (error) {
    console.error('❌ Error actualizando configuración:', error);
    return false;
  }
};

const confirmAccept = async () => {
  saving.value = true;
  try {
    const success = await updateConfig();
    if (success) {
      console.log('✅ Configuración guardada correctamente en el servidor');
      showConfirmModal.value = false;
      setTimeout(() => {
        router.push('/');
      }, 300);
    } else {
      alert('Error al guardar la configuración. Por favor, intenta nuevamente.');
    }
  } catch (error) {
    console.error('❌ Error al guardar configuración:', error);
    alert('Error de conexión al guardar la configuración.');
  } finally {
    saving.value = false;
  }
};

const loadStats = async () => {
  loading.value = true;
  try {
    const response = await api.get('/admin/bot-stats');
    if (response.data.status === 'success') {
      botStats.value = response.data.data;
      
      const config = response.data.data.config || {};
      botsEnabled.value = config.enabled ?? config.ENABLED ?? true;
      // 👇 ya no se asigna currentDifficulty
      botProbability.value = config.botProbability ?? config.BOT_PROBABILITY ?? 100;
      minPlayersToDisable.value = config.minPlayersToDisable ?? config.MIN_PLAYERS_TO_DISABLE_BOTS ?? 5;
    }
  } catch (error) {
    console.error('❌ Error cargando estadísticas:', error);
  } finally {
    loading.value = false;
  }
};

const resetConfig = async () => {
  botsEnabled.value = true;
  botProbability.value = 100;
  minPlayersToDisable.value = 5;
  // 👇 ya no se resetea currentDifficulty
  
  const success = await updateConfig();
  if (success) {
    console.log('✅ Configuración restaurada a valores por defecto');
    await loadStats();
  } else {
    alert('Error al restaurar la configuración en el servidor.');
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
/* ✅ Estilos para el modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: #1e1e24;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 35px 40px;
  border-radius: 16px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  color: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}
.modal-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.modal-content h3 {
  color: #e2e8f0;
  font-size: 1.3rem;
  margin-bottom: 8px;
}

.modal-content p {
  color: #94a3b8;
  font-size: 0.95rem;
  margin-bottom: 24px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-modal-cancel {
  flex: 1;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.04);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn-modal-cancel:hover {
  background: rgba(255, 255, 255, 0.08);
}

.btn-modal-confirm {
  flex: 1;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: rgba(46, 204, 113, 0.12);
  border: 1px solid rgba(46, 204, 113, 0.25);
  color: #4ade80;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn-modal-confirm:hover:not(:disabled) {
  background: rgba(46, 204, 113, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(46, 204, 113, 0.1);
}

.btn-modal-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
/* ✅ Animaciones */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.btn-accept {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(46, 204, 113, 0.08);
  border: 1px solid rgba(46, 204, 113, 0.15);
  color: #4ade80;
}

.btn-accept:hover {
  background: rgba(46, 204, 113, 0.18);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(46, 204, 113, 0.08);
}

/* ✅ Mejorar diseño de admin-actions */
.admin-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}


.btn-refresh,
.btn-reset,
.btn-accept {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.bot-admin-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 40px 20px;
  background-color: #121214;
}

.glass-card {
  background: rgba(30, 30, 36, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 30px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
}

.admin-header {
  text-align: center;
  margin-bottom: 28px;
}

.admin-header h2 {
  color: #fff;
  font-size: 1.8rem;
  margin-bottom: 4px;
}

.admin-subtitle {
  color: #94a3b8;
  font-size: 0.9rem;
}

.admin-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

/* ✅ Toggle Switch */
.toggle-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-text {
  color: #e2e8f0;
  font-weight: 500;
}

.toggle-switch {
  width: 48px;
  height: 26px;
  background: #3a3a40;
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;
  flex-shrink: 0;
}

.toggle-switch.active {
  background: #38bdf8;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch.active .toggle-slider {
  transform: translateX(22px);
}

.toggle-status {
  font-weight: 600;
  font-size: 0.9rem;
}

.toggle-status.active {
  color: #4ade80;
}

.toggle-status:not(.active) {
  color: #f87171;
}

/* ✅ Difficulty */
.difficulty-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.difficulty-label {
  color: #94a3b8;
  font-size: 0.85rem;
}

.difficulty-options {
  display: flex;
  gap: 8px;
}

.difficulty-btn {
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.difficulty-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.difficulty-btn.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  color: #38bdf8;
}

/* ✅ Sliders */
.config-slider {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.slider-label {
  display: flex;
  justify-content: space-between;
  color: #e2e8f0;
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.slider-value {
  color: #38bdf8;
  font-weight: 600;
}

.slider-input {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #3a3a40;
  border-radius: 2px;
  outline: none;
  transition: background 0.3s ease;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #38bdf8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider-hint {
  display: block;
  color: #475569;
  font-size: 0.7rem;
  margin-top: 4px;
}

/* ✅ Stats */
.admin-stats {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 20px;
}

.admin-stats h3 {
  color: #94a3b8;
  font-size: 0.95rem;
  margin-bottom: 12px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  color: #e2e8f0;
  font-size: 0.9rem;
}

.stat-label {
  color: #94a3b8;
}

.stat-value {
  color: #38bdf8;
  font-weight: 500;
}

/* ✅ Actions */
.admin-actions {
  display: flex;
  gap: 12px;
}

.btn-refresh,
.btn-reset {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-refresh {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.btn-refresh:hover {
  background: rgba(56, 189, 248, 0.2);
  transform: translateY(-1px);
}

.btn-reset {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #94a3b8;
}

.btn-reset:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* ✅ Responsive */
@media (max-width: 480px) {
  .glass-card {
    padding: 20px;
  }

  .admin-header h2 {
    font-size: 1.4rem;
  }

  .difficulty-options {
    flex-direction: column;
  }

  .toggle-container {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>