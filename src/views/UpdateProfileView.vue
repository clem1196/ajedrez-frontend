<!-- src/views/UpdateProfileView.vue -->
<template>
  <div class="update-view-wrapper">
    <UpdateProfile />
  </div>
</template>

<script setup lang="ts">
import UpdateProfile from '../components/UpdateProfile.vue';
</script>

<style scoped>
.update-view-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: flex-start; /* para que el contenido no se centre verticalmente y permita scroll */
  background: #0f172a; /* mismo fondo que el contenedor interno para evitar transparencias */
  padding: 1rem;
  box-sizing: border-box;
}
</style>