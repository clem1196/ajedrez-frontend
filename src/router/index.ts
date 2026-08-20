import { useAuthStore } from "@/stores/authStore.ts";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { requiresGuest: true }, // 👈 Redirige si ya tiene sesión
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
      meta: { requiresGuest: true }, // 👈 Redirige si ya tiene sesión
    },
    {
      path: "/game",
      name: "game",
      component: () => import("../views/GameView.vue"), // 🔓 Libre para invitados y logueados
    },
    {
      path: "/ranking",
      name: "ranking",
      component: () => import("../views/RankingView.vue"), // 🔓 Vista pública
    },
    // Rutas protegidas (Admin y Usuario)
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/profile/edit",
      name: "UpdateProfile",
      component: () => import("../views/UpdateProfileView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/auth/success",
      name: "auth-success",
      component: () => import("../views/AuthSuccessView.vue"),
    },
    // Ruta Comodín: Redirige URLs inexistentes al Home
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  // 1. Redirigir a usuarios logueados lejos de /login o /register
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return "/";
  }

  // 2. Proteger rutas que requieren inicio de sesión obligatorio
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return "/login";
  }

  // 3. Proteger panel de administración
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return "/";
  }

  return true;
});

export default router;