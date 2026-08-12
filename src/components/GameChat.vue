<!-- src/components/GameChat.vue -->
<template>
  <div class="chat-wrapper glass-card">
    <div class="chat-header">
      <span>🗣️ Chat</span>
      <span v-if="gameStore.opponentNick" class="chat-opponent">
        <!-- con {{ gameStore.opponentNick }}-->
        <span v-if="gameStore.isBotOpponent" class="bot-badge"></span>
      </span>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <!-- ✅ Mensajes del sistema -->
      <div v-for="msg in gameStore.systemMessages" :key="msg.id" class="chat-bubble-row system-message">
        <div class="chat-bubble system-bubble">
          <p class="message-text">{{ msg.text }}</p>
          <span class="message-time">{{ msg.timestamp }}</span>
        </div>
      </div>

      <!-- ✅ Mensajes de chat -->
      <div v-for="msg in gameStore.messages" :key="msg.id" class="chat-bubble-row"
        :class="{ 'is-me': msg.sender === authStore.currentNick || msg.sender === gameStore.nick }">
        <div class="chat-bubble">
          <span class="sender-name">{{ msg.sender }}</span>
          <p class="message-text">{{ msg.text }}</p>
          <span class="message-time">{{ msg.timestamp }}</span>
        </div>
      </div>

      <div v-if="gameStore.messages.length === 0 && gameStore.systemMessages.length === 0" class="empty-chat">
        <span>💬 Sin mensajes aún</span>
      </div>
    </div>

    <form @submit.prevent="sendMessage" class="chat-input-row">
      <input v-model="newMessage" type="text" placeholder="Escribe un mensaje..." maxlength="200"
        :disabled="!gameStore.roomId || gameStore.gameEnded" autocomplete="off" @keydown="handleKeydown" />
      <button type="submit" class="btn-send-glass"
        :disabled="!newMessage.trim() || !gameStore.roomId || gameStore.gameEnded">
        ▶️
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';

const gameStore = useGameStore();
const authStore = useAuthStore();
const newMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const sendMessage = () => {
  const text = newMessage.value.trim();
  if (!text || !gameStore.roomId || gameStore.gameEnded) return;

  gameStore.sendChatMessage(text);
  newMessage.value = '';
};

// ✅ Auto-scroll al fondo cuando llega un mensaje nuevo
watch(() => [gameStore.messages.length, gameStore.systemMessages.length], async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
});

// ✅ Scroll cuando el chat se monta
onMounted(async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
});

// ✅ Enviar con Ctrl+Enter (se usa en el template)
const handleKeydown = (e: KeyboardEvent) => {
  // ✅ Solo enviar con Ctrl+Enter o Cmd+Enter
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault(); // ✅ Evita el salto de línea
    sendMessage();
  }
  // ✅ Enter solo envía (comportamiento normal del form)
};
</script>

<style scoped>
.system-message {
  justify-content: center !important;
}

.system-bubble {
  background: rgba(56, 189, 248, 0.08) !important;
  border: 1px solid rgba(56, 189, 248, 0.1) !important;
  border-radius: 12px !important;
  text-align: center;
  max-width: 90%;
}

.system-bubble .message-text {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.75rem;
}

.bot-badge {
  font-size: 0.7rem;
  /*background: rgba(56, 189, 248, 0.15);*/
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 4px;
  color: #38bdf8;
}

.chat-wrapper {
  display: flex;
  flex-direction: column;
  background: rgba(25, 25, 35, 0.55);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  height: 200px;
  /* Puedes ajustarlo al alto de tu tablero */
  width: 300px;
  overflow: hidden;
  margin-left: 6px;
}

.chat-header {
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  font-weight: 600;
  color: #94a3b8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.8rem;
}

.chat-messages {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Scrollbar sutil */
.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.chat-bubble-row {
  display: flex;
  width: 100%;
}

.chat-bubble-row.is-me {
  justify-content: flex-end;
}

.chat-bubble {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 8px 12px;
  border-radius: 12px 12px 12px 2px;
  max-width: 80%;
  position: relative;
}

.chat-bubble-row.is-me .chat-bubble {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px 12px 2px 12px;
}

.sender-name {
  display: block;
  font-size: 0.75rem;
  font-weight: bold;
  color: #64748b;
  margin-bottom: 2px;
}

.chat-bubble-row.is-me .sender-name {
  color: #38bdf8;
  text-align: right;
}

.message-text {
  color: #e2e8f0;
  font-size: 0.85rem;
  word-break: break-word;
  margin: 0;
}

.message-time {
  display: block;
  font-size: 0.65rem;
  color: #475569;
  text-align: right;
  margin-top: 3px;
}

.chat-input-row {
  display: flex;
  padding: 10px;
  background: rgba(0, 0, 0, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  gap: 8px;
}

.chat-input-row input {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 12px;
  color: #fff;
  font-size: 0.85rem;
  outline: none;
}

.btn-send-glass {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 6px;
  color: #fff;
  padding: 0 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-send-glass:hover {
  background: rgba(56, 189, 248, 0.2);
}

@media (max-width: 768px) {
  .chat-wrapper {
    font-size: x-small;
    height: auto;
    /* Puedes ajustarlo al alto de tu tablero */
    width: auto;


  }

  .chat-input-row input {
    width: 90px;
  }
}
</style>