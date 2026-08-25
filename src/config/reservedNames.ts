// src/config/reservedNames.ts
export const BOT_NAMES: string[] = [
  // Fáciles
  "Novato", "Aprendiz", "Principiante", "Iniciante", "PechoFrio",
  // Medios
  "Estratega", "Tactico", "Calmado", "Aficionado", "Resolutivo",
  // Difíciles
  "Veterano", "Experto", "Maestro", "Avanzado", "Titan",
  // Grandmaster
  "Master", "GranMaestro", "Leyenda", "Stockfish"
];

// También exportamos versión en minúsculas para comparación insensible a mayúsculas
export const BOT_NAMES_LOWERCASE = BOT_NAMES.map(name => name.toLowerCase());