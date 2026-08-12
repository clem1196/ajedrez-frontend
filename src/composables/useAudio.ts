import { ref, type Ref } from 'vue';

export type SoundEffect = 'move' | 'capture' | 'check' | 'gameOver' | 'illegal';

interface UseAudioReturn {
  isMuted: Ref<boolean>;
  playSound: (soundName: SoundEffect) => void;
  toggleMute: () => void;
}

export function useAudio(): UseAudioReturn {
  // Leemos la preferencia guardada para persistence
  const isMuted = ref<boolean>(localStorage.getItem('chess_muted') === 'true');

  const sounds: Record<SoundEffect, HTMLAudioElement> = {
    move: new Audio('/sounds/move.mp3'),
    capture: new Audio('/sounds/capture.mp3'),
    check: new Audio('/sounds/check.mp3'),
    gameOver: new Audio('/sounds/game-over.mp3'),
    illegal: new Audio('/sounds/illegal.mp3'),
  };

  // Ajustar volumen por defecto
  Object.values(sounds).forEach((audio) => {
    audio.volume = 0.6;
  });

  const playSound = (soundName: SoundEffect): void => {
    if (isMuted.value || !sounds[soundName]) return;

    // Reiniciar tiempo por si se reproduce repetidamente en poco tiempo
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch((err: unknown) => {
      console.warn('Audio play blocked or failed:', err);
    });
  };

  const toggleMute = (): void => {
    isMuted.value = !isMuted.value;
    localStorage.setItem('chess_muted', isMuted.value.toString());
  };

  return {
    isMuted,
    playSound,
    toggleMute,
  };
}