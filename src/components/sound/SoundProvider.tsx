import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { SoundContext, SOUND_STORAGE_KEY } from "@/components/sound/sound-context";
import type { BeatEvent } from "@/lib/ecgEngine";
import { HeartSound } from "@/lib/heartSound";

function readStored(): boolean {
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) === "on";
  } catch {
    // localStorage puede estar bloqueado.
    return false;
  }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  // Apagado por defecto: un sonido que arranca solo molesta, y
  // `prefers-reduced-motion` no cubre el audio.
  const [enabled, setEnabledState] = useState(readStored);
  const soundRef = useRef<HeartSound | null>(null);
  const enabledRef = useRef(enabled);

  enabledRef.current = enabled;

  if (soundRef.current === null) soundRef.current = new HeartSound();

  useEffect(() => {
    const sound = soundRef.current;
    return () => sound?.dispose();
  }, []);

  const resume = useCallback(() => {
    if (enabledRef.current) soundRef.current?.resume();
  }, []);

  const setEnabled = useCallback((on: boolean) => {
    setEnabledState(on);
    enabledRef.current = on;
    // Esto viene de un clic, que es el único momento en que el navegador deja
    // crear o reanudar el contexto de audio.
    if (on) soundRef.current?.resume();
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, on ? "on" : "off");
    } catch {
      // Sin persistencia, pero el sonido funciona en esta sesión.
    }
  }, []);

  const playBeat = useCallback((event: BeatEvent) => {
    if (enabledRef.current) soundRef.current?.play(event);
  }, []);

  const value = useMemo(
    () => ({ enabled, setEnabled, resume, playBeat }),
    [enabled, setEnabled, resume, playBeat],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}
