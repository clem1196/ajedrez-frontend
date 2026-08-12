<!-- src/components/Navbar.vue -->
<template>
  <nav class="navbar-glass">
    <div class="nav-brand" @click="router.push('/')">
      <span class="brand-logo">♟️</span>
      <span class="brand-name">Ajedrez Yá</span>
    </div>

    <div class="nav-actions">
      <!-- 💡 Si está autenticado -->
      <div v-if="authStore.isAuthenticated" class="user-session-info">
        
        <!-- Botón Admin -->
        <button 
          v-if="authStore.isAdmin" 
          class="btn-admin-glass" 
          @click="router.push('/admin')"
          data-tooltip="Panel Admin"
        >
          <span class="btn-icon">⚙️</span>
          <span class="btn-text">Admin</span>
        </button>

        <!-- Botón Ranking -->
        <button 
          class="btn-ranking-glass" 
          @click="goToRanking"
          data-tooltip="Ver Ranking"
        >
          <span class="btn-icon">🏆</span>
          <span class="btn-text">Ranking</span>
        </button>

        <!-- User Pill / Estadísticas -->
        <div class="user-pill">
          <span class="pill-nick">👤 <span class="pill-nick-text">{{ authStore.currentNick }}</span></span>
          <span class="pill-elo">({{ authStore.currentElo }} Elo)</span>
          <span class="pill-stats">
            🏅 {{ authStore.userStats?.wins || 0 }}W {{ authStore.userStats?.losses || 0 }}L
          </span>
        </div>

        <!-- Botón Logout -->
        <button 
          class="btn-logout-glass" 
          @click="handleLogout"
          data-tooltip="Cerrar Sesión"
        >
          <span class="btn-icon">🚪</span>
          <span class="btn-text">Cerrar Sesión</span>
        </button>
      </div>

      <!-- 🔑 Si es invitado -->
      <div v-else class="guest-session-info">
        <div class="guest-pill">
          ⚡ <span class="guest-pill-text">Modo Invitado</span>
        </div>
        <button 
          class="btn-login-glass" 
          @click="router.push('/login')"
          data-tooltip="Iniciar Sesión"
        >
          <span class="btn-icon">🔑</span>
          <span class="btn-text">Iniciar Sesión</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const goToRanking = () => {
  router.push('/ranking');
};

const handleLogout = () => {
  if (confirm('¿Seguro que deseas cerrar sesión?')) {
    authStore.logout();
    router.push('/');
  }
};
</script>

<style scoped>
/* ==========================================================================
   ESTILOS BASE
   ========================================================================== */
.navbar-glass {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: rgba(20, 20, 25, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  user-select: none;
}

.nav-brand:hover {
  opacity: 0.8;
}

.brand-logo {
  font-size: 1.6rem;
}

.brand-name {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-actions {
  display: flex;
  align-items: center;
}

.user-session-info,
.guest-session-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* User Pill */
.user-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.user-pill:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
}

.pill-nick {
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pill-elo {
  color: #38bdf8;
  font-weight: bold;
  font-size: 0.8rem;
}

.pill-stats {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-left: 4px;
}

.guest-pill {
  font-size: 0.8rem;
  color: #64748b;
  background: rgba(255, 255, 255, 0.03);
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  font-weight: 500;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Botones Glass Unificados */
.btn-admin-glass,
.btn-ranking-glass,
.btn-login-glass,
.btn-logout-glass {
  position: relative;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid transparent;
  white-space: nowrap;
  height: 34px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-admin-glass {
  background: rgba(255, 165, 0, 0.08);
  border-color: rgba(255, 165, 0, 0.2);
  color: #fbbf24;
}
.btn-admin-glass:hover {
  background: rgba(255, 165, 0, 0.18);
  box-shadow: 0 0 16px rgba(255, 165, 0, 0.12);
  transform: translateY(-1px);
}

.btn-ranking-glass {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
}
.btn-ranking-glass:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transform: translateY(-1px);
}

.btn-login-glass {
  background: rgba(56, 189, 248, 0.08);
  border-color: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}
.btn-login-glass:hover {
  background: rgba(56, 189, 248, 0.18);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.12);
  transform: translateY(-1px);
}

.btn-logout-glass {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
}
.btn-logout-glass:hover {
  background: rgba(239, 68, 68, 0.15);
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.08);
  transform: translateY(-1px);
}

/* ==========================================================================
   OPTIMIZACIÓN RESPONSIVA EN MÓVILES (< 768px y < 480px)
   ========================================================================== */
@media (max-width: 768px) {
  .navbar-glass {
    padding: 0 12px;
    height: 52px;
  }

  .user-session-info,
  .guest-session-info {
    gap: 6px;
  }

  /* Oculta los textos de los botones */
  .btn-text,
  .guest-pill-text {
    display: none;
  }

  /* Convierte botones en cuadrados/círculos compactos */
  .btn-admin-glass,
  .btn-ranking-glass,
  .btn-login-glass,
  .btn-logout-glass {
    padding: 0;
    width: 32px;
    height: 32px;
    justify-content: center;
    border-radius: 8px;
  }

  .btn-icon {
    font-size: 0.95rem;
  }

  /* Mantiene nick y Elo pero reduce las estadísticas complejas */
  .pill-stats {
    display: none;
  }

  .user-pill {
    padding: 4px 10px;
    font-size: 0.75rem;
  }

  /* Tooltips al pasar el mouse en móviles/tablets */
  [data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: #181920;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #fff;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.68rem;
    white-space: nowrap;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
    z-index: 120;
    pointer-events: none;
    animation: tooltipFade 0.2s ease forwards;
  }
}

@media (max-width: 480px) {
  .navbar-glass {
    padding: 0 8px;
    height: 48px;
  }

  .brand-name {
    font-size: 0.85rem;
  }

  .brand-logo {
    font-size: 1.2rem;
  }

  /* En pantallas muy pequeñas, oculta el Nick pero deja el Elo */
  .pill-nick-text {
    display: none;
  }

  .user-pill {
    padding: 3px 8px;
    font-size: 0.7rem;
  }

  .btn-admin-glass,
  .btn-ranking-glass,
  .btn-login-glass,
  .btn-logout-glass {
    width: 28px;
    height: 28px;
  }

  .btn-icon {
    font-size: 0.85rem;
  }
}

@keyframes tooltipFade {
  from { opacity: 0; transform: translate(-50%, -4px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
</style>