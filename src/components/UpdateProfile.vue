<template>
  <div class="update-profile-container">
    <div class="profile-card">
      <h2 class="title">✏️ Editar Perfil</h2>
      <p class="subtitle">Gestiona tu información personal y seguridad.</p>

      <!-- Alertas de Estado -->
      <div v-if="errorMessage" class="alert alert-danger">
        ⚠️ {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="alert alert-success">
        ✅ {{ successMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="profile-form">
        <!-- Campo: Nick -->
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

        <!-- Campo: Email -->
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

        <!-- Campo: Contraseña Actual -->
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

        <!-- Campo: Nueva Contraseña -->
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

        <!-- Botones de Acción -->
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore'; // Asegúrate de ajustar la ruta a tu store

const router = useRouter();
const authStore = useAuthStore();

// Estado local del formulario
const form = ref({
  nick: '',
  email: '',
  currentPassword: '',
  newPassword: ''
});

// Respaldo para comparar cambios
const originalData = ref({
  nick: '',
  email: ''
});

const errorMessage = ref('');
const successMessage = ref('');

// Cargar los datos actuales desde el store al cargar la vista
onMounted(() => {
  if (authStore.user) {
    form.value.nick = authStore.user.nick || '';
    form.value.email = authStore.user.email || '';
    
    originalData.value = {
      nick: form.value.nick,
      email: form.value.email
    };
  }
});

// Comprobar si hay modificaciones pendientes
const hasChanges = computed(() => {
  const isProfileChanged = form.value.nick !== originalData.value.nick || 
                           form.value.email !== originalData.value.email;
  const isPasswordProvided = Boolean(form.value.newPassword);
  
  return isProfileChanged || isPasswordProvided;
});

// Enviar formulario utilizando el método del store
const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  // Validación básica previa de contraseñas
  if (form.value.newPassword && !form.value.currentPassword) {
    errorMessage.value = 'Debes ingresar tu contraseña actual para establecer una nueva.';
    return;
  }

  // Construir payload limpio (solo enviar lo necesario)
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

  // Llamada al authStore
  const result = await authStore.updateProfile(payload);

  if (result.success) {
    successMessage.value = result.message || 'Perfil actualizado correctamente.';
    
    // Limpiar campos sensibles
    form.value.currentPassword = '';
    form.value.newPassword = '';

    // Actualizar copia original con la nueva información
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
</style>