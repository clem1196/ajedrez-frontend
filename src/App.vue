<!-- src/App.vue -->
<template>
  <div class="app-layout">
    <!-- 💡 Renderizado global de la Navbar -->
    <Navbar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>
<script setup lang="ts">
import { RouterView } from 'vue-router';
import { onMounted } from 'vue';
import { socket } from './services/socketService';
import Navbar from './components/Navbar.vue'; // 👈 Importamos la barra

onMounted(() => {
  // Esto asegura que el archivo del socket se cargue 
  // y quede escuchando eventos globales desde el inicio
  console.log('App de Ajedrez inicializada. Buscando conexiones...');
});
</script>
<style>
/* Estilos globales para quitar márgenes por defecto y poner fondo oscuro */
html, body {
  margin: 0;
  padding: 0;
  background-color: #121214;
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}
</style>