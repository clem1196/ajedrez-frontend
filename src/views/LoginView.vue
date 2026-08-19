<!-- src/views/LoginView.vue -->
<template>
  <div class="auth-container">
    <div class="auth-card glass-card">
      <div class="auth-header">
        <h2>♟️ {{ isLogin ? 'Bienvenido de Vuelta' : 'Únete a la Arena' }}</h2>
        <p class="auth-subtitle">
          {{ isLogin ? 'Ingresa tus credenciales para continuar' : 'Crea tu cuenta y comienza a jugar' }}
        </p>
      </div>

      <div class="auth-tabs">
        <button :class="['tab-btn', { active: isLogin }]" @click="switchTab(true)" type="button">
          Iniciar Sesión
        </button>
        <button :class="['tab-btn', { active: !isLogin }]" @click="switchTab(false)" type="button">
          Registrarse
        </button>
      </div>

      <div v-if="errorMessage" class="alert-box error-glass">
        ⚠️ {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="alert-box success-glass">
        ✅ {{ successMessage }}
      </div>

      <!-- ✅ FORMULARIO TRADICIONAL (sin cambios) -->
      <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
        <div v-if="!isLogin" class="form-group">
          <label for="nick">Nick (Nombre de usuario)</label>
          <div class="nick-wrapper">
            <input v-model="formData.nick" type="text" id="nick" placeholder="Ej: Capablanca_99" required minlength="3"
              maxlength="15" pattern="[A-Za-z0-9_]+" title="Solo letras, números y guión bajo"
              autocomplete="username" />
          </div>
          <small class="input-hint">3-15 caracteres, solo letras, números y _</small>
        </div>

        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <div class="email-wrapper">
            <input v-model="formData.email" type="email" id="email" placeholder="tu_correo@gmail.com" required
              autocomplete="email" />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="password-wrapper">
            <input v-model="formData.password" :type="showPassword ? 'text' : 'password'" id="password"
              placeholder="••••••••" required minlength="6" autocomplete="current-password" />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword" tabindex="-1">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <small v-if="!isLogin" class="input-hint">Mínimo 6 caracteres</small>
        </div>

        <button type="submit" class="btn-glass submit-btn" :disabled="authStore.loading || !isFormValid">
          {{ authStore.loading ? 'Procesando...' : (isLogin ? '🚀 Entrar a la Arena' : '✨ Crear Cuenta') }}
        </button>
      </form>

      <!-- ✅ NUEVO: SEPARADOR Y BOTONES SOCIALES -->
      <div class="social-divider">
        <span class="divider-line"></span>
        <span class="divider-text">o continúa con</span>
        <span class="divider-line"></span>
      </div>

      <div class="social-buttons">
        <button @click="loginWith('google')" class="social-btn google-btn" type="button">
          <span class="social-icon">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#EA4335"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#4285F4"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </span>
          Google
        </button>
          <button @click="loginWith('github')" class="social-btn github-btn" type="button">
          <span class="social-icon">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#1877F2"
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </span>
          Facebook
        </button>

        <button @click="loginWith('facebook')" class="social-btn facebook-btn" type="button">
          <span class="social-icon">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#1877F2"
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </span>
          Facebook
        </button>

        <button @click="loginWith('microsoft')" class="social-btn microsoft-btn" type="button">
          <span class="social-icon">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M13 1h10v10H13z" />
              <path fill="#05a6f0" d="M1 13h10v10H1z" />
              <path fill="#ffba08" d="M13 13h10v10H13z" />
            </svg>
          </span>
          Microsoft
        </button>
      </div>

      <div class="auth-footer">
        <p>
          {{ isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}
          <button type="button" class="link-btn" @click="switchTab(!isLogin)">
            {{ isLogin ? 'Regístrate' : 'Inicia Sesión' }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const isLogin = ref(true);
const showPassword = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const formData = reactive({
  nick: '',
  email: '',
  password: '',
});

// ✅ Validación del formulario (sin cambios)
const isFormValid = computed(() => {
  if (isLogin.value) {
    return formData.email.trim() !== '' && formData.password.length >= 6;
  }
  return (
    formData.nick.trim().length >= 3 &&
    formData.nick.trim().length <= 15 &&
    /^[A-Za-z0-9_]+$/.test(formData.nick) &&
    formData.email.trim() !== '' &&
    formData.password.length >= 6
  );
});

// ✅ Limpiar alertas y formulario al cambiar de pestaña (sin cambios)
const switchTab = (tab: boolean) => {
  if (isLogin.value !== tab) {
    isLogin.value = tab;
    errorMessage.value = '';
    successMessage.value = '';
    formData.nick = '';
    formData.email = '';
    formData.password = '';
    showPassword.value = false;
  }
};

// ✅ Watch para limpiar mensajes (sin cambios)
watch(
  () => formData.email,
  () => {
    if (errorMessage.value) errorMessage.value = '';
  }
);

watch(
  () => formData.password,
  () => {
    if (errorMessage.value) errorMessage.value = '';
  }
);

// ✅ Login tradicional (sin cambios)
const handleSubmit = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Por favor, completa todos los campos correctamente.';
    return;
  }

  errorMessage.value = '';
  successMessage.value = '';

  try {
    if (isLogin.value) {
      const res = await authStore.login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (res.success) {
        router.push({ name: 'home' });
      } else {
        errorMessage.value = res.message || '❌ Credenciales incorrectas. Verifica tu email y contraseña.';
      }
    } else {
      const res = await authStore.register({
        nick: formData.nick.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (res.success) {
        successMessage.value = '✅ ¡Cuenta creada exitosamente! Ya puedes iniciar sesión.';
        setTimeout(() => {
          switchTab(true);
          formData.email = '';
          formData.password = '';
          successMessage.value = '';
        }, 1500);
      } else {
        errorMessage.value = res.message || '❌ Error en los datos de registro. Intenta nuevamente.';
      }
    }
  } catch (error) {
    errorMessage.value = '❌ Ocurrió un error inesperado. Intenta nuevamente.';
    console.error('Auth error:', error);
  }
};

// ✅ NUEVO: Función para login social
const loginWith = (provider: string) => {
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  // Redirige correctamente a /api/auth/google, /api/auth/facebook, etc.[cite: 1]
  window.location.href = `${backendUrl}/auth/${provider}`;
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
  max-width: 440px;
  padding: 30px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;
}

.auth-header h2 {
  color: #fff;
  font-size: 1.6rem;
  margin-bottom: 4px;
}

.auth-subtitle {
  color: #94a3b8;
  font-size: 0.9rem;
}

.auth-tabs {
  display: flex;
  border-bottom: 2px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 24px;
}

.tab-btn {
  flex: 1;
  background: none;
  border: none;
  color: #8a8a93;
  padding: 12px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn:hover {
  color: #cbd5e1;
}

.tab-btn.active {
  color: #38bdf8;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 25%;
  right: 25%;
  height: 2px;
  background: #38bdf8;
  border-radius: 2px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

}

.form-group label {
  font-size: 0.85rem;
  color: #cbd5e1;
  text-align: left;
  font-weight: 500;
}



.form-group::placeholder {
  color: #64748b;
}

/* ✅ Input con hint */
.input-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 2px;
}

.email-wrapper {
  position: relative;

}

.email-wrapper input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 14px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  width: 92%
}

.email-wrapper input:focus {
  outline: none;
  border-color: #38bdf8;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
}

/* ✅ Password wrapper con toggle */
.password-wrapper {
  position: relative;

}

.password-wrapper input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 14px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  width: 92%
}

.password-wrapper input:focus {
  outline: none;
  border-color: #38bdf8;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
}

.nick-wrapper {
  position: relative;

}

.nick-wrapper input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 14px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  width: 92%
}

.nick-wrapper input:focus {
  outline: none;
  border-color: #38bdf8;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
}


.toggle-password {
  position: absolute;
  transform: translateY(-50%);
  right: 16px;
  top: 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0px;
  color: #94a3b8;
  transition: color 0.2s ease;
}

.toggle-password:hover {
  color: #e2e8f0;
}

.btn-glass {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  padding: 14px;
  border-radius: 8px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 4px;
}

.btn-glass:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
  transform: translateY(-2px);
}

.btn-glass:active:not(:disabled) {
  transform: translateY(0);
}

.btn-glass:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alert-box {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 16px;
  text-align: left;
  animation: slideDown 0.3s ease;
}

.error-glass {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.success-glass {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.auth-footer {
  margin-top: 20px;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 20px;
}

.auth-footer p {
  color: #94a3b8;
  font-size: 0.9rem;
}

.link-btn {
  background: none;
  border: none;
  color: #38bdf8;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.link-btn:hover {
  color: #7dd3fc;
  text-decoration: underline;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
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
    font-size: 1.3rem;
  }

  .tab-btn {
    font-size: 0.9rem;
    padding: 10px;
  }

  .btn-glass {
    font-size: 0.95rem;
    padding: 12px;
  }
}

/* ===== ✅ NUEVOS ESTILOS PARA SOCIAL DIVIDER Y BOTONES ===== */
.social-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 20px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.divider-text {
  color: #64748b;
  font-size: 0.85rem;
  white-space: nowrap;
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.social-btn:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.08);
}

.social-btn:active {
  transform: translateY(0);
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

/* Colores específicos de cada proveedor */
.google-btn:hover {
  border-color: #EA4335;
  box-shadow: 0 0 20px rgba(234, 67, 53, 0.15);
}
.github-btn:hover {
  border-color: #4d535c;
  box-shadow: 0 0 20px rgba(24, 119, 242, 0.15);
}
.facebook-btn:hover {
  border-color: #1877F2;
  box-shadow: 0 0 20px rgba(24, 119, 242, 0.15);
}

.microsoft-btn:hover {
  border-color: #00A4EF;
  box-shadow: 0 0 20px rgba(0, 164, 239, 0.15);
}

/* Responsive */
@media (max-width: 480px) {
  .glass-card {
    padding: 20px;
  }

  .auth-header h2 {
    font-size: 1.3rem;
  }

  .tab-btn {
    font-size: 0.9rem;
    padding: 10px;
  }

  .btn-glass {
    font-size: 0.95rem;
    padding: 12px;
  }

  .social-btn {
    font-size: 0.85rem;
    padding: 10px 14px;
  }
}
</style>