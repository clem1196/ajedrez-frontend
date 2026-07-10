<!-- src/views/RegisterView.vue -->
<template>
  <div class="auth-container">
    <div class="auth-card glass-card">
      <div class="auth-header">
        <h2>💎 ¡Convierte tu Progreso!</h2>
        <p class="auth-subtitle">
          Guarda tu cuenta y conserva tu puntaje <strong>{{ inheritedElo }}</strong> Elo
        </p>
      </div>

      <!-- Alertas de Estado -->
      <div v-if="errorMessage" class="alert-box error-glass">
        ⚠️ {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="alert-box success-glass">
        ✅ {{ successMessage }}
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <!-- Campo Nick: Prellenado con el nick usado en la partida -->
        <div class="form-group">
          <label for="nick">Tu Nick de Jugador</label>
          <input 
            v-model="formData.nick" 
            type="text" 
            id="nick" 
            placeholder="Ej: Terminator77" 
            required 
            maxLength="15"
            minlength="3"
            pattern="[A-Za-z0-9_]+"
          />
          <small class="help-text" style="color: #4ade80;" v-if="inheritedElo > 1200">
            🚀 Guardarás tu cuenta con <strong>{{ inheritedElo }}</strong> Elo. ¡Felicidades por tu victoria!
          </small>
          <small class="help-text" style="color: #cbd5e1;" v-else>
            🛡️ Comenzarás con <strong>{{ inheritedElo }}</strong> Elo.
          </small>
        </div>

        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input 
            v-model="formData.email" 
            type="email" 
            id="email" 
            placeholder="tu_correo@gmail.com" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="password-wrapper">
            <input 
              v-model="formData.password" 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              placeholder="Mínimo 6 caracteres" 
              required 
              minlength="6"
            />
            <button 
              type="button" 
              class="toggle-password"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <small class="help-text">Mínimo 6 caracteres</small>
        </div>

        <button type="submit" class="btn-glass submit-btn" :disabled="authStore.loading || !isFormValid">
          {{ authStore.loading ? '⏳ Guardando...' : '💾 Salvar mi Puntuación' }}
        </button>

        <div class="auth-footer">
          <button type="button" class="btn-link" @click="router.push('/')">
            ← Volver al Menú Principal (Seguir como Invitado)
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const gameStore = useGameStore();
const router = useRouter();

const errorMessage = ref('');
const successMessage = ref('');
const showPassword = ref(false);
const inheritedElo = ref(1200);

const formData = reactive({
  nick: '',
  email: '',
  password: '',
});

// ✅ Validación del formulario
const isFormValid = computed(() => {
  return (
    formData.nick.trim().length >= 3 &&
    formData.nick.trim().length <= 15 &&
    /^[A-Za-z0-9_]+$/.test(formData.nick) &&
    formData.email.trim() !== '' &&
    formData.password.length >= 6
  );
});

onMounted(() => {
  // ✅ Recuperar datos de la partida del invitado
  const currentNick = gameStore.nick || sessionStorage.getItem('guest_backup_nick') || '';
  
  // ✅ Calcular Elo final (base + cambio)
  let baseElo = gameStore.elo || Number(sessionStorage.getItem('guest_backup_elo')) || 1200;
  let eloChange = 0;

  // ✅ Si hay cambio de Elo registrado en el store
  if (gameStore.eloChange !== undefined && gameStore.eloChange !== 0) {
    eloChange = gameStore.eloChange;
  } else {
    // ✅ Calcular cambio basado en el mensaje de fin de partida
    const msg = (gameStore.endGameMessage || '').toLowerCase();
    if (!msg.includes('tablas') && !msg.includes('empate') && msg.length > 0) {
      const iAmWhite = gameStore.myColor === 'w';
      const whiteWon = msg.includes('blancas ganan') || msg.includes('victoria de las blancas');
      const blackWon = msg.includes('negras ganan') || msg.includes('victoria de las negras');

      if (whiteWon) {
        eloChange = iAmWhite ? 16 : -16;
      } else if (blackWon) {
        eloChange = iAmWhite ? -16 : 16;
      } else {
        // Fallback por turno
        const currentTurn = gameStore.currentFen?.split(' ')[1];
        const isOurTurnAtEnd = currentTurn === gameStore.myColor;
        eloChange = isOurTurnAtEnd ? -16 : 16;
      }
    }
  }

  // ✅ Asignar valores al formulario
  if (currentNick) {
    formData.nick = currentNick;
    inheritedElo.value = Math.max(1200, baseElo + eloChange); // Nunca menos de 1200
  } else {
    console.warn('⚠️ No se detectó un nick de partida previa.');
    inheritedElo.value = 1200;
  }

  // ✅ Guardar respaldo en sessionStorage
  if (currentNick) {
    sessionStorage.setItem('guest_backup_nick', currentNick);
    sessionStorage.setItem('guest_backup_elo', String(inheritedElo.value));
  }
});

const handleRegister = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Por favor, completa todos los campos correctamente.';
    return;
  }

  errorMessage.value = '';
  successMessage.value = '';

  try {
    // ✅ Registrar usuario con el Elo heredado
    const res = await authStore.register({
      nick: formData.nick.trim(),
      email: formData.email.trim(),
      password: formData.password,
      initialElo: inheritedElo.value
    });

    if (res.success) {
      successMessage.value = '✅ ¡Cuenta guardada con éxito! Tu Elo ha sido respaldado.';

      // ✅ Auto-login para experiencia fluida
      const loginRes = await authStore.login({
        email: formData.email,
        password: formData.password
      });

      if (loginRes.success) {
        if (authStore.user) {
          gameStore.nick = authStore.user.nick;
          gameStore.elo = authStore.user.elo;
        }
        gameStore.resetGame();
        
        // ✅ Limpiar respaldos de sesión
        sessionStorage.removeItem('guest_backup_nick');
        sessionStorage.removeItem('guest_backup_elo');
        
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } else {
      errorMessage.value = res.message || '❌ Error al guardar la cuenta.';
    }
  } catch (error) {
    errorMessage.value = '❌ Ocurrió un error inesperado.';
    console.error('Register error:', error);
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 85vh;
  padding: 20px;
}

.glass-card {
  background: rgba(30, 30, 36, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  padding: 28px 30px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
}

.auth-header {
  text-align: center;
  margin-bottom: 20px;
}

.auth-header h2 {
  color: #fff;
  font-size: 1.4rem;
  margin-bottom: 2px;
}

.auth-subtitle {
  color: #94a3b8;
  font-size: 0.85rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.form-group label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.form-group input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 14px;
  color: #ffffff;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  height: 28px;
  width: 92%;
}

.form-group input:focus {
  outline: none;
  border-color: #38bdf8;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.1);
}

.form-group input::placeholder {
  color: #475569;
}

.password-wrapper {
  position: relative;
  width: 92%;
}

.password-wrapper input {
  padding-right: 40px;
}

.toggle-password {
  position: absolute;
  right: -20px;
  top: 24px;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0px;
  color: #64748b;
  transition: color 0.2s ease;
}

.toggle-password:hover {
  color: #e2e8f0;
}

.help-text {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 2px;
}

.btn-glass {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #38bdf8;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 4px;
  height: 44px;
}

.btn-glass:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
  transform: translateY(-1px);
}

.btn-glass:active:not(:disabled) {
  transform: translateY(0);
}

.btn-glass:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-link {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 8px;
  transition: color 0.2s ease;
  width: 100%;
  text-align: center;
}

.btn-link:hover {
  color: #fff;
}

.auth-footer {
  margin-top: 4px;
  text-align: center;
}

.alert-box {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 14px;
  text-align: left;
  animation: slideDown 0.3s ease;
}

.error-glass {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.success-glass {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ✅ Responsive */
@media (max-width: 480px) {
  .glass-card {
    padding: 20px;
  }
  
  .auth-header h2 {
    font-size: 1.2rem;
  }
  
  .form-group input {
    height: 38px;
    padding: 8px 12px;
    font-size: 0.9rem;
  }
  
  .btn-glass {
    height: 40px;
    font-size: 0.9rem;
    padding: 10px;
  }
}
</style>