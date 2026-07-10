<!-- src/views/RankingView.vue -->
<template>
    <div class="ranking-container">
        <div class="ranking-card glass-card">
            <button class="btn-return" @click="btnReturn">X</button>
            <div class="ranking-header">

                <h2>🏆 Salón de la Fama</h2>
                <p>Los mejores estrategas de Ajedrez de Frente</p>
            </div>

            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input v-model="searchQuery" @input="handleSearch" type="text" placeholder="Buscar rival por nick..."
                    maxlength="30" />
                <button v-if="searchQuery" class="clear-search" @click="clearSearch" type="button">
                    ✕
                </button>
            </div>

            <!-- ✅ Indicador de resultados -->
            <div v-if="!loading && users.length > 0" class="result-count">
                Mostrando {{ users.length }} jugadores
                <span v-if="searchQuery">(búsqueda: "{{ searchQuery }}")</span>
            </div>

            <div class="table-responsive">
                <table class="ranking-table">
                    <thead>
                        <tr>
                            <th class="text-center">Puesto</th>
                            <th>Jugador</th>
                            <th class="text-right">Puntaje Elo</th>
                            <th class="text-right">Partidas</th>
                            <th class="text-right">Victorias</th>
                            <th class="text-right">% Victorias</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="6" class="text-center py-4">
                                <div class="spinner-small"></div>
                                <span>Cargando clasificaciones...</span>
                            </td>
                        </tr>
                        <tr v-else-if="users.length === 0" class="no-results">
                            <td colspan="6" class="text-center py-4">
                                <span v-if="searchQuery">No se encontraron jugadores con "{{ searchQuery }}"</span>
                                <span v-else>No hay jugadores registrados aún.</span>
                            </td>
                        </tr>
                        <tr v-else v-for="user in users" :key="user.userId || user.id"
                            :class="{ 'highlight-me': user.nick === authStore.currentNick }">
                            <td class="text-center rank-col">
                                <span v-if="user.rank === 1" class="medal gold">🥇</span>
                                <span v-else-if="user.rank === 2" class="medal silver">🥈</span>
                                <span v-else-if="user.rank === 3" class="medal bronze">🥉</span>
                                <span v-else class="rank-number">#{{ user.rank }}</span>
                            </td>
                            <td class="nick-col">
                                {{ user.nick }}
                                <span v-if="user.nick === authStore.currentNick" class="me-badge">(Tú)</span>
                                <!-- ✅ Badge de invitado si no tiene userId -->
                                <span v-if="!user.userId" class="guest-badge">👤 Invitado</span>
                            </td>
                            <td class="text-right elo-col font-bold">{{ user.elo }}</td>
                            <td class="text-right stats-col">{{ user.totalGames || 0 }}</td>
                            <td class="text-right stats-col">{{ user.wins || 0 }}</td>
                            <td class="text-right stats-col">
                                <span :class="getWinRateClass(user.winRate)">
                                    {{ user.winRate || 0 }}%
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- ✅ Paginación mejorada -->
            <div v-if="pagination.totalPages > 1" class="pagination-controls">
                <button :disabled="pagination.currentPage === 1" @click="changePage(pagination.currentPage - 1)"
                    class="btn-page-glass">
                    ◀️ Anterior
                </button>

                <div class="page-info">
                    <span class="page-indicator">
                        Página {{ pagination.currentPage }} de {{ pagination.totalPages }}
                    </span>
                    <span class="total-users">
                        ({{ pagination.totalUsers }} jugadores)
                    </span>
                </div>

                <button :disabled="pagination.currentPage === pagination.totalPages"
                    @click="changePage(pagination.currentPage + 1)" class="btn-page-glass">
                    Siguiente ▶️
                </button>
            </div>

            <!-- ✅ Posición del usuario autenticado -->
            <div v-if="authStore.isAuthenticated && userRank" class="user-rank-box">
                <span>📍 Tu posición actual: </span>
                <strong>#{{ userRank }}</strong>
                <span class="user-elo-display">({{ authStore.currentElo }} Elo)</span>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { useRouter } from 'vue-router';

const router = useRouter()
const authStore = useAuthStore();

// ✅ Interfaz para los datos del ranking
interface RankingUser {
    id?: number;
    userId?: number;
    rank: number;
    nick: string;
    elo: number;
    wins: number;
    losses: number;
    draws: number;
    totalGames: number;
    winRate: number;
}

const users = ref<RankingUser[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const userRank = ref<number | null>(null);

const pagination = ref({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 15, // ✅ Cambiado a 15 como en el backend
});

let timeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * 📊 Obtener el ranking desde el backend
 */
const fetchLeaderboard = async (page = 1) => {
    loading.value = true;
    try {
        const response = await api.get('/users/leaderboard', {
            params: {
                page,
                limit: pagination.value.limit,
                search: searchQuery.value || undefined,
            }
        });

        if (response.data.status === "success") {
            users.value = response.data.data;
            pagination.value = {
                currentPage: response.data.pagination.currentPage,
                totalPages: response.data.pagination.totalPages,
                totalUsers: response.data.pagination.totalUsers,
                limit: response.data.pagination.limit,
            };
            userRank.value = response.data.userRank || null;
        }
    } catch (error) {
        console.error("❌ Error al traer el ranking:", error);
        // ✅ Mostrar error amigable
        users.value = [];
    } finally {
        loading.value = false;
    }
};

const btnReturn = () => {
    router.push("/")
}
/**
 * 🔍 Manejar búsqueda con debounce
 */
const handleSearch = () => {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
        fetchLeaderboard(1);
    }, 400);
};

/**
 * 🧹 Limpiar búsqueda
 */
const clearSearch = () => {
    searchQuery.value = '';
    fetchLeaderboard(1);
};

/**
 * 📄 Cambiar página
 */
const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.value.totalPages) {
        fetchLeaderboard(newPage);
        // ✅ Scroll al inicio de la tabla
        const table = document.querySelector('.table-responsive');
        if (table) {
            table.scrollTop = 0;
        }
    }
};

/**
 * 🎨 Obtener clase CSS según el porcentaje de victorias
 */
const getWinRateClass = (winRate: number) => {
    if (winRate >= 70) return 'winrate-excellent';
    if (winRate >= 50) return 'winrate-good';
    if (winRate >= 30) return 'winrate-average';
    return 'winrate-low';
};

// ✅ Cargar ranking al montar el componente
onMounted(() => {
    fetchLeaderboard();
});
onUnmounted(() => {
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
});
</script>

<style scoped>
.btn-return {
    flex: 1;
    padding: 12px;
    padding-left: 16px;
    padding-right: 16px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
}

.btn-return {
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.2);
    color: #38bdf8;
}

.btn-return:hover {
    background: rgba(56, 189, 248, 0.2);
    transform: translateY(-1px);
}

.ranking-container {
    display: flex;
    justify-content: center;
    padding: 40px 20px;
    min-height: 80vh;
    background-color: #121214;
}

.glass-card {
    background: rgba(25, 25, 35, 0.65);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 30px;
    width: 100%;
    max-width: 800px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.ranking-header {
    text-align: center;
    margin-bottom: 24px;
}

.ranking-header h2 {
    font-size: 1.8rem;
    color: #fff;
    margin-bottom: 4px;
}

.ranking-header p {
    color: #94a3b8;
    font-size: 0.95rem;
}

/* ✅ Search box mejorado */
.search-box {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 10px 15px;
    margin-bottom: 12px;
    transition: border-color 0.3s ease;
}

.search-box:focus-within {
    border-color: rgba(56, 189, 248, 0.3);
}

.search-icon {
    color: #64748b;
    font-size: 0.9rem;
}

.search-box input {
    background: transparent;
    border: none;
    color: #fff;
    margin-left: 10px;
    width: 100%;
    outline: none;
    font-size: 0.95rem;
}

.search-box input::placeholder {
    color: #475569;
}

.clear-search {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0 4px;
    transition: color 0.2s ease;
}

.clear-search:hover {
    color: #fff;
}

/* ✅ Result count */
.result-count {
    color: #64748b;
    font-size: 0.8rem;
    margin-bottom: 12px;
    text-align: right;
}

/* ✅ Tabla mejorada */
.table-responsive {
    overflow-x: auto;
    margin: 0 -4px;
}

.ranking-table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
}

.ranking-table th {
    color: #64748b;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 10px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    font-weight: 600;
}

.ranking-table td {
    padding: 12px 8px;
    color: #cbd5e1;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    font-size: 0.9rem;
    transition: background 0.2s ease;
}

.ranking-table tbody tr:hover td {
    background: rgba(255, 255, 255, 0.02);
}

.rank-number {
    display: inline-block;
    min-width: 24px;
    text-align: center;
    font-weight: 600;
    color: #64748b;
}

.medal {
    font-size: 1.3rem;
}

.medal.gold {
    filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.5));
}

.medal.silver {
    filter: drop-shadow(0 0 4px rgba(192, 192, 192, 0.5));
}

.medal.bronze {
    filter: drop-shadow(0 0 4px rgba(205, 127, 50, 0.5));
}

/* ✅ Highlight del usuario actual */
.highlight-me {
    background: rgba(56, 189, 248, 0.06) !important;
}

.highlight-me td {
    color: #38bdf8;
}

.highlight-me .rank-number {
    color: #38bdf8;
}

.me-badge {
    font-size: 0.65rem;
    background: #38bdf8;
    color: #0f172a;
    padding: 1px 8px;
    border-radius: 4px;
    font-weight: 600;
    margin-left: 6px;
}

.guest-badge {
    font-size: 0.6rem;
    background: rgba(255, 255, 255, 0.06);
    color: #64748b;
    padding: 1px 6px;
    border-radius: 4px;
    margin-left: 4px;
}

/* ✅ Estilos de columnas */
.text-center {
    text-align: center;
}

.text-right {
    text-align: right;
}

.rank-col {
    width: 60px;
}

.nick-col {
    text-align: left;
    font-weight: 500;
}

.elo-col {
    color: #38bdf8;
    font-weight: 600;
}

.stats-col {
    color: #94a3b8;
    font-size: 0.85rem;
}

/* ✅ WinRate con colores */
.winrate-excellent {
    color: #4ade80;
    font-weight: 600;
}

.winrate-good {
    color: #38bdf8;
    font-weight: 500;
}

.winrate-average {
    color: #fbbf24;
}

.winrate-low {
    color: #f87171;
}

/* ✅ Spinner de carga */
.spinner-small {
    border: 3px solid rgba(255, 255, 255, 0.1);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border-left-color: #38bdf8;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 8px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.no-results td {
    color: #64748b;
    padding: 30px 0;
}

/* ✅ Paginación mejorada */
.pagination-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    flex-wrap: wrap;
    gap: 10px;
}

.btn-page-glass {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #fff;
    padding: 6px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.85rem;
}

.btn-page-glass:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
}

.btn-page-glass:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
}

.page-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.page-indicator {
    color: #94a3b8;
    font-size: 0.9rem;
}

.total-users {
    color: #475569;
    font-size: 0.8rem;
}

/* ✅ Posición del usuario */
.user-rank-box {
    margin-top: 16px;
    padding: 10px 16px;
    background: rgba(56, 189, 248, 0.06);
    border: 1px solid rgba(56, 189, 248, 0.1);
    border-radius: 8px;
    text-align: center;
    color: #94a3b8;
    font-size: 0.9rem;
}

.user-rank-box strong {
    color: #38bdf8;
    font-size: 1.1rem;
}

.user-elo-display {
    color: #38bdf8;
    font-weight: 500;
}

/* ✅ Responsive */
@media (max-width: 768px) {
    .glass-card {
        padding: 20px;
    }

    .ranking-header h2 {
        font-size: 1.4rem;
    }

    .ranking-table th,
    .ranking-table td {
        font-size: 0.75rem;
        padding: 8px 4px;
    }

    .rank-col {
        width: 40px;
    }

    .pagination-controls {
        justify-content: center;
        flex-direction: column;
        gap: 8px;
    }

    .page-info {
        flex-direction: column;
        gap: 2px;
        text-align: center;
    }

    .search-box {
        padding: 8px 12px;
    }

    .user-rank-box {
        font-size: 0.8rem;
        padding: 8px 12px;
    }
}

@media (max-width: 480px) {

    .ranking-table th:nth-child(4),
    .ranking-table th:nth-child(5),
    .ranking-table th:nth-child(6),
    .ranking-table td:nth-child(4),
    .ranking-table td:nth-child(5),
    .ranking-table td:nth-child(6) {
        display: none;
    }

    .ranking-table th:nth-child(3),
    .ranking-table td:nth-child(3) {
        text-align: center;
    }
}
</style>