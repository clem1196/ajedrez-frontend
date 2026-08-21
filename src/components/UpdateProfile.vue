<!--src/components/UpdateProfile.vue-->
<template>
  <div class="update-profile-container">
    <div class="profile-card">
      <div class="card-header">
        <h2 class="title">✏️ Editar Perfil</h2>
        <p class="subtitle">Gestiona tu información personal y seguridad.</p>
      </div>

      <transition-group name="fade" tag="div">
        <div v-if="errorMessage" key="error" class="alert alert-danger">
          <span class="alert-icon">⚠️</span> {{ errorMessage }}
        </div>
        <div v-if="successMessage" key="success" class="alert alert-success">
          <span class="alert-icon">✅</span> {{ successMessage }}
        </div>
      </transition-group>

      <form @submit.prevent="handleSubmit" class="profile-form">
        <div class="form-group">
          <label for="nick">
            <span class="label-icon">👤</span> Nombre de Usuario
          </label>
          <input
            id="nick"
            v-model="form.nick"
            type="text"
            placeholder="Tu nick"
            required
            :disabled="authStore.loading"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="email">
            <span class="label-icon">📧</span> Correo Electrónico
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="correo@ejemplo.com"
            required
            :disabled="authStore.loading"
            class="form-input"
          />
        </div>

        <hr class="divider" />

        <div class="section-subtitle">
          <span class="lock-icon">🔒</span> Cambiar Contraseña <span class="optional">(Opcional)</span>
        </div>

        <div class="form-group">
          <label for="currentPassword">Contraseña Actual</label>
          <input
            id="currentPassword"
            v-model="form.currentPassword"
            type="password"
            placeholder="••••••••"
            :disabled="authStore.loading"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="newPassword">Nueva Contraseña</label>
          <input
            id="newPassword"
            v-model="form.newPassword"
            type="password"
            placeholder="••••••••"
            :disabled="authStore.loading"
            class="form-input"
          />
        </div>

        <div class="form-actions">
          <button
            type="button"
            @click="cancelEdit"
            class="btn-secondary"
            :disabled="authStore.loading"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="authStore.loading || !hasChanges"
          >
            <span v-if="authStore.loading">Guardando...</span>
            <span v-else>💾 Guardar Cambios</span>
          </button>
        </div>
      </form>

      <hr class="divider" />

      <!-- 🔗 SECCIÓN DE CUENTAS VINCULADAS -->
      <div class="social-section">
        <div class="section-subtitle">
          <span class="link-icon">🔗</span> Cuentas Vinculadas
        </div>

        <div class="social-links-container">
          <!-- Google -->
          <div class="social-item">
            <span class="social-name">🌐 Google</span>
            <button
              v-if="!authStore.user?.googleId"
              @click="linkProvider('google')"
              class="btn-link"
              :disabled="linkingProvider === 'google'"
            >
              {{ linkingProvider === 'google' ? 'Conectando...' : 'Vincular' }}
            </button>
            <span v-else class="status-connected">
              <span class="check">✓</span> Vinculado
            </span>
          </div>

          <!-- GitHub -->
          <div class="social-item">
            <span class="social-name">🐙 GitHub</span>
            <button
              v-if="!authStore.user?.githubId"
              @click="linkProvider('github')"
              class="btn-link"
              :disabled="linkingProvider === 'github'"
            >
              {{ linkingProvider === 'github' ? 'Conectando...' : 'Vincular' }}
            </button>
            <span v-else class="status-connected">
              <span class="check">✓</span> Vinculado
            </span>
          </div>

          <!-- Lichess -->
          <div class="social-item">
            <span class="social-name">♟️ Lichess</span>
            <button
              v-if="!authStore.user?.lichessId"
              @click="linkProvider('lichess')"
              class="btn-link"
              :disabled="linkingProvider === 'lichess'"
            >
              {{ linkingProvider === 'lichess' ? 'Conectando...' : 'Vincular' }}
            </button>
            <span v-else class="status-connected">
              <span class="check">✓</span> Vinculado
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = ref({
  nick: '',
  email: '',
  currentPassword: '',
  newPassword: ''
});

const originalData = ref({
  nick: '',
  email: ''
});

const errorMessage = ref('');
const successMessage = ref('');
const linkingProvider = ref<string | null>(null);

onMounted(async () => {
  // 1. Refrescar los datos del perfil desde el Backend para obtener las IDs sociales recién vinculadas
  if (typeof authStore.fetchProfile === 'function') {
    await authStore.fetchProfile();
  }
  console.log('Usuario en Store:', authStore.user);
  // 2. Cargar datos en el formulario
  if (authStore.user) {
    form.value.nick = authStore.user.nick || '';
    form.value.email = authStore.user.email || '';
    originalData.value = {
      nick: form.value.nick,
      email: form.value.email
    };
  }

  // 3. Procesar respuestas devueltas en la URL tras volver del OAuth
  if (route.query.linked) {
    const providerName = String(route.query.linked);
    const formattedProvider = providerName.charAt(0).toUpperCase() + providerName.slice(1);
    successMessage.value = `¡Cuenta de ${formattedProvider} vinculada exitosamente!`;
    router.replace({ query: {} });
  } else if (route.query.error) {
    errorMessage.value = 'Hubo un error al intentar vincular la cuenta o ya está vinculada a otro usuario.';
    router.replace({ query: {} });
  }
});

const linkProvider = (provider: string) => {
  linkingProvider.value = provider;
  const token = authStore.token || localStorage.getItem('token');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://ajedrez-backend-scym.onrender.com';
  
  // Redirección con el token
  window.location.href = `${backendUrl}/api/auth/link/${provider}?token=${token}`;
};

const hasChanges = computed(() => {
  const isProfileChanged = form.value.nick !== originalData.value.nick || 
                           form.value.email !== originalData.value.email;
  const isPasswordProvided = Boolean(form.value.newPassword);
  return isProfileChanged || isPasswordProvided;
});

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (form.value.newPassword && !form.value.currentPassword) {
    errorMessage.value = 'Debes ingresar tu contraseña actual para establecer una nueva.';
    return;
  }

  const payload: {
    nick?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  } = {};

  if (form.value.nick !== originalData.value.nick) payload.nick = form.value.nick;
  if (form.value.email !== originalData.value.email) payload.email = form.value.email;
  if (form.value.newPassword) {
    payload.currentPassword = form.value.currentPassword;
    payload.newPassword = form.value.newPassword;
  }

  const result = await authStore.updateProfile(payload);

  if (result.success) {
    successMessage.value = result.message || 'Perfil actualizado correctamente.';
    form.value.currentPassword = '';
    form.value.newPassword = '';

    if (authStore.user) {
      originalData.value = {
        nick: authStore.user.nick,
        email: authStore.user.email
      };
    }

    setTimeout(() => {
      router.push('/');
    }, 1500);
  } else {
    errorMessage.value = result.message;
  }
};

const cancelEdit = () => {
  router.push('/');
};
</script>

<style scoped>
.update-profile-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  padding: 0;
  background: transparent;
  box-sizing: border-box;
}

.profile-card {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 2rem 2rem 1.8rem;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  color: #f1f5f9;
  transition: all 0.3s ease;
  max-height: 85vh;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #475569 transparent;
}

.profile-card::-webkit-scrollbar {
  width: 5px;
}
.profile-card::-webkit-scrollbar-track {
  background: transparent;
}
.profile-card::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 10px;
}

.card-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 0.95rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

.alert {
  padding: 0.8rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  margin-bottom: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-left: 4px solid;
  animation: slideDown 0.3s ease;
}

.alert-danger {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #fca5a5;
}

.alert-success {
  background: rgba(34, 197, 94, 0.15);
  border-color: #22c55e;
  color: #86efac;
}

.alert-icon {
  font-size: 1.2rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.label-icon {
  font-size: 1rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid #334155;
  background: #0f172a;
  color: #f8fafc;
  font-size: 0.95rem;
  transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
}

.form-input:focus {
  outline: none;
  border-color: #818cf8;
  background: #1e293b;
  box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.15);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin: 0.8rem 0;
}

.section-subtitle {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.optional {
  font-weight: 400;
  font-size: 0.75rem;
  color: #94a3b8;
}

.lock-icon,
.link-icon {
  font-size: 1.1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
  background: #334155;
  color: #64748b;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.btn-secondary {
  background: rgba(51, 65, 85, 0.6);
  color: #cbd5e1;
  border: 1px solid #475569;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(71, 85, 105, 0.8);
}

.social-section {
  margin-top: 0.5rem;
}

.social-links-container {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-top: 0.5rem;
}

.social-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.6);
  padding: 0.7rem 1rem;
  border-radius: 10px;
  border: 1px solid #334155;
  transition: border-color 0.2s, background 0.2s;
}

.social-item:hover {
  border-color: #4b5563;
  background: rgba(30, 41, 59, 0.6);
}

.social-name {
  font-weight: 500;
  font-size: 0.95rem;
}

.btn-link {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 0.35rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-link:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.status-connected {
  color: #4ade80;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.check {
  font-size: 1.1rem;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 600px) {
  .profile-card {
    padding: 1.5rem;
    border-radius: 16px;
    max-height: 95vh;
  }

  .title {
    font-size: 1.6rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .social-item {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>