//src/utils/chess.util.ts
import type { BoardTheme } from "@/interfaces/chessInterface";

// Lista de temas disponibles (tipo Chess.com)
export const boardThemes: BoardTheme[] = [
  {
    id: "green",
    name: "Chess.com Classic",
    light: "#eeeed2",
    dark: "#769656",
    // Resaltado amarillo verdoso semitransparente característico de Chess.com
    selected: "#20549380",      // Azul suave para casilla seleccionada
    lastMove: "#f5f68280",      // Amarillo cálido semitransparente
    check: "#e63946cc",         // Rojo intenso con opacidad
    moveDot: "#00000026",       // Punto negro translúcido clásico
    moveRing: "#00000033",
    arrowGreen: "#15b01a",
    arrowRed: "#e63946",
    arrowBlue: "#0077b6",
    arrowYellow: "#ffb703",
    coordinates: "#ffffff",
    border: "#4b6138",
    shadow: "0 12px 35px rgba(0, 0, 0, 0.45)",
  },

  {
    id: "brown",
    name: "Madera Clásica",
    light: "#f0d9b5",
    dark: "#b58863",
    // Tonos cálidos/dorados para resaltar sobre la madera sin perder la textura
    selected: "#6b422680",      // Marrón oscuro semitransparente
    lastMove: "#cdd26a80",      // Verde-amarillento lichess tradicional
    check: "#ff3333cc",
    moveDot: "#52361b40",       // Punto café translúcido
    moveRing: "#52361b60",
    arrowGreen: "#2ecc71",
    arrowRed: "#e74c3c",
    arrowBlue: "#3498db",
    arrowYellow: "#f1c40f",
    coordinates: "#ffffff",
    border: "#7c5b3c",
    shadow: "0 12px 35px rgba(119, 78, 3, 0.45)",
  },

  {
    id: "blue",
    name: "Azul Océano",
    light: "#dee3e6",
    dark: "#8ca2ad",
    // Paleta azul/grisácea suave al estilo Lichess Icónico
    selected: "#0088cc80",      // Cyan/Azul de selección
    lastMove: "#82976280",      // Oliva suave que contrasta muy bien con el azul
    check: "#ff4d4dcc",
    moveDot: "#2c3e5040",       // Azul marino translúcido
    moveRing: "#2c3e5060",
    arrowGreen: "#27ae60",
    arrowRed: "#c0392b",
    arrowBlue: "#2980b9",
    arrowYellow: "#f39c12",
    coordinates: "#ffffff",
    border: "#52656d",
    shadow: "0 12px 35px rgba(44, 62, 80, 0.45)",
  },

  {
    id: "monochrome",
    name: "Blanco y Negro",
    light: "#e0e0e0",
    dark: "#4a4a4a",
    // Estilo minimalista con alto contraste
    selected: "#007acc99",      // Azul moderno para resaltar piezas activas
    lastMove: "#fbc53180",      // Amarillo suave para contrastar con gris oscuro/blanco
    check: "#e74c3ccc",
    moveDot: "#91919150",       // Puntos claros translúcidos
    moveRing: "#dadada80",
    arrowGreen: "#2ecc71",
    arrowRed: "#e74c3c",
    arrowBlue: "#3498db",
    arrowYellow: "#f1c40f",
    coordinates: "#ffffff",
    border: "#2d2d2d",
    shadow: "0 12px 35px rgba(0, 0, 0, 0.6)",
  },

  {
    id: "glass",
    name: "Neón / Vidrio",
    light: "#1e293b",          // Azul oscuro/pizarra profundo
    dark: "#0f172a",           // Azul casi negro
    // Estilo Synthwave / Cyberpunk moderno
    selected: "#38bdf880",      // Neón Cyan translúcido
    lastMove: "#a855f780",      // Púrpura Neón translúcido
    check: "#f43f5ecc",         // Rosa/Rojo Neón
    moveDot: "#38bdf860",       // Cyan vibrante para posibles movimientos
    moveRing: "#38bdf8a0",
    arrowGreen: "#10b981",
    arrowRed: "#f43f5e",
    arrowBlue: "#06b6d4",
    arrowYellow: "#eab308",
    coordinates: "#94a3b8",
    border: "#334155",
    shadow: "0 12px 35px rgba(15, 23, 42, 0.8)",
  },
];
