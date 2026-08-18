<template>
  <div class="loading-container">
    <p>Iniciando sesión con red social...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  const token = route.query.token as string;
  if (token) {
    // Guarda el token en tu Pinia store / localStorage
    await authStore.setTokenAndFetchUser(token);
    router.push({ name: 'home' });
  } else {
    router.push({ name: 'login', query: { error: 'social_login_failed' } });
  }
});
</script>