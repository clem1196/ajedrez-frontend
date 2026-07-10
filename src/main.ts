// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router'; // 💡 Asegúrate de importar tu enrutador

const app = createApp(App);

app.use(createPinia());
app.use(router); // 💡 ¡Esto es vital para que <RouterView /> funcione!

app.mount('#app');