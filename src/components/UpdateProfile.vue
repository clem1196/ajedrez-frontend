<template>
  <div class="update-profile-container">
    <div class="profile-card">
      <h2 class="title">✏️ Editar Perfil</h2>
      <p class="subtitle">Gestiona tu información personal y seguridad.</p>

      <div v-if="errorMessage" class="alert alert-danger">
        ⚠️ {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="alert alert-success">
        ✅ {{ successMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="profile-form">
        <div class="form-group">
          <label for="nick">Nombre de Usuario (Nick)</label>
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
          <label for="email">Correo Electrónico</label>
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
        <p class="section-subtitle">🔒 Cambiar Contraseña (Opcional)</p>

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
            <span v-else>Guardar Cambios</span>
          </button>
        </div>
      </form>

      <hr class="divider" />
      <p class="section-subtitle">🔗 Cuentas Vinculadas</p>
      <div class="social-links-container">
        
        <div class="social-item">
          <span>🌐 Google</span>
          <button 
            v-if="!authStore.user?.googleId" 
            @click="linkProvider('google')" 
            class="btn-link"
          >
            Vincular
          </button>
          <span v-else class="status-connected">✓ Vinculado</span>
        </div>

        <div class="social-item">
          <span>🐙 GitHub</span>
          <button 
            v-if="!authStore.user?.githubId" 
            @click="linkProvider('github')" 
            class="btn-link"
          >
            Vincular
          </button>
          <span v-else class="status-connected">✓ Vinculado</span>
        </div>

        <div class="social-item">
          <span>♟️ Lichess</span>
          <button 
            v-if="!authStore.user?.lichessId" 
            @click="linkProvider('lichess')" 
            class="btn-link"
          >
            Vincular
          </button>
          <span v-else class="status-connected">✓ Vinculado</span>
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

onMounted(() => {
  if (authStore.user) {
    form.value.nick = authStore.user.nick || '';
    form.value.email = authStore.user.email || '';
    
    originalData.value = {
      nick: form.value.nick,
      email: form.value.email
    };
  }

  // Detectar si venimos de vincular una cuenta con éxito
  if (route.query.linked) {
    successMessage.value = `¡Cuenta de ${route.query.linked} vinculada exitosamente!`;
    // Limpiar query params de la URL
    router.replace({ query: {} });
  } else if (route.query.error) {
    errorMessage.value = 'Hubo un error al intentar vincular la cuenta.';
    router.replace({ query: {} });
  }
});

// Función para iniciar la vinculación con el backend
const linkProvider = (provider: string) => {
  const token = authStore.token || localStorage.getItem('token');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://ajedrez-backend-scym.onrender.com';
  
  // Redirigimos al endpoint del backend enviando el JWT
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
/* (Estilos existentes intactos...) */

.update-profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 1.5rem;
}

.profile-card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  color: #fff;
}

.title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  text-align: center;
}

.subtitle {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 1.5rem;
  text-align: center;
}

.section-subtitle {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0.5rem 0;
}

.divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 1.2rem 0;
}

.alert {
  padding: 0.8rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1.2rem;
  text-align: center;
}

.alert-danger {
  background-color: rgba(239, 68, 68, 0.2);
  border: 1px solid #ef4444;
  color: #fca5a5;
}

.alert-success {
  background-color: rgba(34, 197, 94, 0.2);
  border: 1px solid #22c55e;
  color: #86efac;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
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
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #334155;
  background-color: #0f172a;
  color: #f8fafc;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #1e293b;
  color: #64748b;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #334155;
  color: #cbd5e1;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #475569;
}

/* 🎨 NUEVOS ESTILOS PARA LA SECCIÓN DE REDES SOCIALES */
.social-links-container {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 0.5rem;
}

.social-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #0f172a;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #334155;
}

.btn-link {
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-link:hover {
  background-color: #1d4ed8;
}

.status-connected {
  color: #4ade80;
  font-weight: 600;
  font-size: 0.85rem;
}
</style>