import { createContext, useContext } from "react";

import type { BeatEvent } from "@/lib/ecgEngine";

export const SOUND_STORAGE_KEY = "beat-pulse-sound";

export interface SoundContextValue {
  enabled: boolean;
  setEnabled: (on: boolean) => void;
  /** Reanuda el contexto de audio. Sólo vale desde un gesto del usuario. */
  resume: () => void;
  playBeat: (event: BeatEvent) => void;
}

export const SoundContext = createContext<SoundContextValue | null>(null);

export function useSound(): SoundContextValue {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSound debe usarse dentro de SoundProvider");
  return context;
}
