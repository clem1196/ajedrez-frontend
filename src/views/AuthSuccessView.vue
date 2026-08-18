<template>
  <div class="auth-loading">
    <p>Autenticando y cargando perfil...</p>
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
    const result = await authStore.setTokenAndFetchUser(token);
    if (result.success) {
      router.push({ name: 'home' });
    } else {
      router.push({ name: 'login', query: { error: 'profile_failed' } });
    }
  } else {
    router.push({ name: 'login', query: { error: 'token_missing' } });
  }
});
</script>