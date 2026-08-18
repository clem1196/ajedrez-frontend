import { useAuthStore } from "@/stores/authStore.ts";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"), // 💡 Importación dinámica
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"), // 💡 Importación dinámica
    },
    {
      path: "/game",
      name: "game",
      component: () => import("../views/GameView.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
    },
    {
      path: "/ranking",
      name: "ranking",
      component: () => import("../views/RankingView.vue"),
    },
    //admin
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
      meta: { requiresAuth: true },
    },

    {
      path: "/profile/edit",
      name: "UpdateProfile",
      component: () => import("../views/UpdateProfileView.vue"),
      meta: { requiresAuth: true }, // si tu router maneja guardas de autenticación
    },
    {
      path: "/auth/success",
      name: "auth-success",
      component: () => import("../views/AuthSuccessView.vue"),
    },
  ],
});
router.beforeEach((to, from) => {
  const authStore = useAuthStore();

  // ✅ Si la ruta requiere autenticación y no está autenticado
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return "/login";
  }

  // ✅ Si intenta acceder a /admin y no es admin
  if (to.path === "/admin" && !authStore.isAdmin) {
    return "/";
  }

  // ✅ Permitir acceso
  return true;
});

export default router;
