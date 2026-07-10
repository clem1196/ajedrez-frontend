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

      <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
        <!-- ✅ Campo de Nick SOLO en registro -->
        <div v-if="!isLogin" class="form-group">
          <label for="nick">Nick (Nombre de usuario)</label>
         <div class="nick-wrapper">
           <input v-model="formData.nick" type="text" id="nick" placeholder="Ej: Capablanca_99" required minlength="3"
            maxlength="15" pattern="[A-Za-z0-9_]+" title="Solo letras, números y guión bajo" autocomplete="username" />
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

// ✅ Validación del formulario
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

// ✅ Limpiar alertas y formulario al cambiar de pestaña
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

// ✅ Watch para limpiar mensajes cuando el usuario escribe
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

const handleSubmit = async () => {
  // ✅ Validación extra antes de enviar
  if (!isFormValid.value) {
    errorMessage.value = 'Por favor, completa todos los campos correctamente.';
    return;
  }

  errorMessage.value = '';
  successMessage.value = '';

  try {
    if (isLogin.value) {
      // ✅ Lógica de Inicio de Sesión
      const res = await authStore.login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (res.success) {
        // ✅ Redirigir al home después del login exitoso
        router.push({ name: 'home' });
      } else {
        errorMessage.value = res.message || '❌ Credenciales incorrectas. Verifica tu email y contraseña.';
      }
    } else {
      // ✅ Lógica de Registro
      const res = await authStore.register({
        nick: formData.nick.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (res.success) {
        successMessage.value = '✅ ¡Cuenta creada exitosamente! Ya puedes iniciar sesión.';
        // ✅ Limpiar formulario y cambiar a login después de 1.5s
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
</style>