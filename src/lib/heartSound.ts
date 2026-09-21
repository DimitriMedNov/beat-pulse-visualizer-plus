// Bip por latido con Web Audio. La arritmia se oye mucho mejor de lo que se ve:
// la pausa de una extrasístole y el hueco de un latido caído se reconocen al
// oído antes que en el trazo.

import type { BeatEvent } from "./ecgEngine";

export interface Tone {
  /** Hercios. */
  frequency: number;
  /** Segundos. */
  duration: number;
  /** Ganancia de pico, de 0 a 1. */
  level: number;
}

const NORMAL_TONE: Tone = { frequency: 880, duration: 0.07, level: 0.14 };
/** Más grave y más largo: el golpe sordo de un latido ventricular. */
const VENTRICULAR_TONE: Tone = { frequency: 520, duration: 0.12, level: 0.18 };

/**
 * Qué suena en cada latido. Un latido que no conduce NO suena: el silencio es
 * justo lo que hay que oír en un bloqueo.
 */
export function toneForBeat(event: BeatEvent): Tone | null {
  if (!event.conducted) return null;
  return event.ventricular ? VENTRICULAR_TONE : NORMAL_TONE;
}

/**
 * Envoltorio del AudioContext.
 *
 * El contexto se crea perezosamente y SÓLO desde `resume`, que a su vez hay que
 * llamar desde un gesto del usuario: los navegadores bloquean el audio que
 * arranca solo, así que crearlo en un efecto de montaje daría un contexto
 * suspendido para siempre.
 */
export class HeartSound {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;

  get ready(): boolean {
    return this.context !== null && this.context.state === "running";
  }

  /** Crea o reanuda el contexto. Llamar desde un manejador de clic. */
  resume(): void {
    if (typeof AudioContext === "undefined") return;

    if (this.context === null) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      void this.context.resume();
    }
  }

  play(event: BeatEvent): void {
    const tone = toneForBeat(event);
    if (tone === null) return;

    const context = this.context;
    const master = this.master;
    if (!context || !master || context.state !== "running") return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, now);

    // Ataque rápido y caída exponencial: suena a bip, no a pitido sostenido.
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(tone.level, now + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + tone.duration);

    oscillator.connect(envelope);
    envelope.connect(master);

    oscillator.start(now);
    oscillator.stop(now + tone.duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  dispose(): void {
    void this.context?.close();
    this.context = null;
    this.master = null;
  }
}
