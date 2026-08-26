export interface PlayerPayload {
  id: string;
  nick: string;
  elo?: number;
  isRegistered?: boolean;
  isBot?: boolean;
}

export interface StartGamePayload {
  roomId: string;
  fen: string;
  white: PlayerPayload;
  black: PlayerPayload;
  initialTimeAllocated?: number;
  moveDeadline?: number;
}