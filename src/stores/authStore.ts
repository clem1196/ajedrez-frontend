// src/stores/authStore.ts
import { defineStore } from "pinia";
import api from "../services/api";

interface UserProfile {
  id: number;
  nick: string;
  email: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  totalGames?: number;
  winRate?: number;
  isAdmin?: boolean;
}

export const useAuthStore = defineStore("auth", {
 state: () => {
    // Intentar leer el usuario guardado previamente
    const savedUser = localStorage.getItem("chess_user");
    
    return {
      user: savedUser ? (JSON.parse(savedUser) as UserProfile) : null,
      token: localStorage.getItem("chess_token") || null,
      loading: false,
      error: null as string | null,
    };
  },

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    currentNick: (state) => state.user?.nick || "Invitado",
    currentElo: (state) => state.user?.elo || 1200,
    // ✅ Getter para obtener el ID del usuario
    currentUserId: (state) => state.user?.id || null,
    isAdmin: (state) => state.user?.isAdmin || false,
    userStats: (state) =>
      state.user
        ? {
            wins: state.user.wins || 0,
            losses: state.user.losses || 0,
            draws: state.user.draws || 0,
            totalGames: state.user.totalGames || 0,
            winRate: state.user.winRate || 0,
          }
        : null,
  },

  actions: {
    /**
     * 🔐 Iniciar sesión y guardar el token JWT
     */
    async login(credentials: { email: string; password: string }) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post("/auth/login", credentials);
        const { token, user } = response.data;

        this.token = token;
        this.user = user;
        localStorage.setItem("chess_token", token);
        localStorage.setItem("chess_user", JSON.stringify(user));
        console.log(
          `✅ Login exitoso: ${user.nick} (Admin: ${user.isAdmin ? "Sí" : "No"})`,
        );

        return { success: true };
      } catch (err: any) {
        const message =
          err.response?.data?.message || "Error al iniciar sesión";
        this.error = message;
        return { success: false, message };
      } finally {
        this.loading = false;
      }
    },
    async fetchProfile() {
      if (!this.token) return;

      try {
        const response = await api.get("/auth/me");
        this.user = response.data.user;
        return { success: true };
      } catch (err) {
        this.logout();
        return { success: false };
      }
    },
    /**
     * 📝 Registrar una nueva cuenta
     */
    async register(userData: {
      nick: string;
      email: string;
      password: string;
      initialElo?: number;
    }) {
      this.loading = true;
      this.error = null;
      try {
        await api.post("/auth/register", userData);
        return { success: true };
      } catch (err: any) {
        const message = err.response?.data?.message || "Error en el registro";
        this.error = message;
        return { success: false, message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * 🚪 Cerrar sesión limpiando el estado y almacenamiento
     */
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem("chess_token");
      localStorage.removeItem("chess_user");
    },

    /**
     * ✅ Actualizar usuario
     */
    async updateProfile(data: {
      nick?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    }) {
      this.loading = true;
      try {
        const response = await api.put("/auth/profile", data);
        this.user = response.data.user;
        localStorage.setItem("chess_user", JSON.stringify(response.data.user));
        return { success: true, message: response.data.message };
      } catch (err: any) {
        return {
          success: false,
          message: err.response?.data?.message || "Error al actualizar perfil",
        };
      } finally {
        this.loading = false;
      }
    },

    /**
     * ✅ NUEVO: Actualizar todo el resultado de la partida de una sola vez
     * (Elo + Victorias/Derrotas/Empates)
     */
    updateLocalElo(newElo: number, result?: "win" | "loss" | "draw") {
      if (!this.user) return;

      // 1. Actualizar Elo
      this.user.elo = newElo;

      // 2. Actualizar estadísticas de partidas (Victorias/Derrotas/Empates)
      if (result === "win") {
        this.user.wins = (this.user.wins || 0) + 1;
      } else if (result === "loss") {
        this.user.losses = (this.user.losses || 0) + 1;
      } else if (result === "draw") {
        this.user.draws = (this.user.draws || 0) + 1;
      }

      console.log(
        `✅ Elo actualizado localmente: ${this.user.elo} (${result || "sin resultado"})`,
      );
    },
    /**
     * 🧹 Limpiar errores
     */
    clearError() {
      this.error = null;
    },
  },
});
