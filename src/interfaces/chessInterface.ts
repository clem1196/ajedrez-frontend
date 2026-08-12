// src/interfaces/chessInterface.ts
export interface BoardTheme {
    id: string;
    name: string;

    // tablero
    light: string;
    dark: string;

    // resaltados
    selected: string;    
    lastMove: string;
    check: string;

    // movimientos legales
    moveDot: string;
    moveRing: string;

    // análisis
    arrowGreen: string;
    arrowRed: string;
    arrowBlue: string;
    arrowYellow: string;

    // interfaz
    coordinates: string;
    border: string;
    shadow: string;
}