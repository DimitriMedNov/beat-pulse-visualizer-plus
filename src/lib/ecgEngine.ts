// Motor de la señal. No sabe nada de React ni del DOM, así que se puede probar
// directamente y se puede dibujar con lo que sea.
//
// La clave está en `advance`: el tiempo real que trae `requestAnimationFrame` se
// acumula y se consume en pasos FIJOS de 1/SAMPLE_RATE segundos. Un monitor a
// 144 Hz y otro a 30 Hz producen exactamente la misma onda; lo único que cambia
// es cada cuánto se redibuja.

import type { Beat } from "./beats";
import { beatSample, complexTiming, type ComplexTiming } from "./ecgWaveform";
import { beatSeconds, type Rhythm } from "./rhythms";

/** Muestras por segundo de señal simulada. */
export const SAMPLE_RATE = 250;
/** Segundos de trazo visibles a la vez. */
export const WINDOW_SECONDS = 6;
/** Tope por frame, para no recuperar minutos de golpe al volver a una pestaña en segundo plano. */
const MAX_FRAME_SECONDS = 0.25;

/** Lo que hay que saber de un latido que acaba de empezar. */
export interface BeatEvent {
  /** Llega a los ventrículos, o sea que hay QRS. Un latido caído no. */
  conducted: boolean;
  /** Origen ventricular: complejo ancho, como la extrasístole. */
  ventricular: boolean;
}

export class ECGEngine {
  /**
   * Se llama al empezar cada latido, desde el paso de simulación. Permite
   * enganchar el sonido y el contador sin que tengan que sondear el estado.
   */
  onBeatStarted: ((event: BeatEvent) => void) | null = null;

  readonly capacity: number;
  private readonly step: number;
  private readonly samples: Float32Array;

  private head = 0;
  private filled = 0;
  private carry = 0;

  private rhythm: Rhythm;
  private beat: Beat;
  private timing: ComplexTiming;
  private beatIndex = 0;
  private beatElapsed = 0;
  /** Intervalo RR de este latido: complejo + silencio. */
  private beatDuration: number;
  private clock = 0;
  private beats = 0;

  constructor(rhythm: Rhythm, sampleRate = SAMPLE_RATE, windowSeconds = WINDOW_SECONDS) {
    this.step = 1 / sampleRate;
    this.capacity = Math.round(sampleRate * windowSeconds);
    this.samples = new Float32Array(this.capacity);
    this.rhythm = rhythm;
    this.beat = rhythm.beats(0);
    this.beatDuration = beatSeconds(rhythm) * this.beat.rrScale;
    this.timing = complexTiming(this.beatDuration, this.beat.morphology);
    this.reset();
  }

  /** Número de muestras disponibles (siempre `capacity` tras un reset). */
  get length(): number {
    return this.filled;
  }

  /** Latidos completados desde el último reset. */
  get beatCount(): number {
    return this.beats;
  }

  /** Cambia de ritmo y limpia la pantalla. Para un cambio explícito del usuario. */
  setRhythm(rhythm: Rhythm): void {
    this.rhythm = rhythm;
    this.reset();
  }

  /**
   * Cambia el ritmo SIN borrar lo que hay en pantalla. Pensado para el
   * deslizador de frecuencia: la nueva frecuencia se aplica al silencio que
   * queda del latido en curso y, a partir del siguiente, a todo el intervalo.
   * El complejo que se está dibujando no se deforma a media onda.
   */
  updateRhythm(rhythm: Rhythm): void {
    this.rhythm = rhythm;
    const target = beatSeconds(rhythm) * this.beat.rrScale;
    this.beatDuration = Math.max(this.timing.durationSeconds, target);
  }

  /** Vuelve al estado inicial: línea isoeléctrica ocupando toda la ventana. */
  reset(): void {
    this.samples.fill(0);
    this.head = 0;
    this.filled = this.capacity;
    this.carry = 0;
    this.beatIndex = 0;
    this.beatElapsed = 0;
    this.clock = 0;
    this.beats = 0;
    this.startBeat(0);
  }

  /**
   * Avanza la señal `deltaSeconds` de tiempo real.
   * Devuelve cuántos latidos empezaron durante ese intervalo.
   */
  advance(deltaSeconds: number): number {
    if (!(deltaSeconds > 0)) return 0;
    this.carry += Math.min(deltaSeconds, MAX_FRAME_SECONDS);

    let started = 0;
    while (this.carry >= this.step) {
      this.carry -= this.step;
      started += this.stepOnce();
    }
    return started;
  }

  /** Muestra en la posición `i`, de la más antigua (0) a la más reciente. */
  at(i: number): number {
    const start = (this.head - this.filled + this.capacity) % this.capacity;
    return this.samples[(start + i) % this.capacity];
  }

  /** Copia de la ventana completa, de la más antigua a la más reciente. */
  snapshot(): Float32Array {
    const out = new Float32Array(this.filled);
    for (let i = 0; i < this.filled; i += 1) out[i] = this.at(i);
    return out;
  }

  private stepOnce(): number {
    this.clock += this.step;
    this.beatElapsed += this.step;

    let started = 0;
    if (this.beatElapsed >= this.beatDuration) {
      this.beatElapsed -= this.beatDuration;
      this.beatIndex += 1;
      this.beats += 1;
      this.startBeat(this.beatIndex);
      started = 1;
      this.onBeatStarted?.({
        conducted: this.beat.morphology.hasQrs,
        ventricular: this.beat.morphology.qrsWidthScale > 1,
      });
    }

    // El complejo se dibuja en tiempo absoluto desde el inicio del latido y se
    // acaba solo; el resto del intervalo RR es línea isoeléctrica.
    this.push(beatSample(this.beatElapsed, this.timing) + this.baseline());
    return started;
  }

  /** Fija la forma y la geometría del latido `index`. */
  private startBeat(index: number): void {
    this.beat = this.rhythm.beats(index);
    this.beatDuration = beatSeconds(this.rhythm) * this.beat.rrScale;
    this.timing = complexTiming(this.beatDuration, this.beat.morphology);
  }

  /**
   * Línea de base: una deriva lenta para que el trazo no se vea sintéticamente
   * plano, más el temblor propio del ritmo. En la fibrilación auricular ese
   * temblor son las ondas f, a 5-11 Hz, que es la tercera firma de la entidad
   * junto con la ausencia de P y la irregularidad de los intervalos.
   */
  private baseline(): number {
    const drift = 0.015 * Math.sin(this.clock * 0.9);
    const noise = this.rhythm.baselineNoise;
    if (noise === 0) return drift;

    const t = this.clock;
    const fWaves =
      0.5 * Math.sin(2 * Math.PI * 7.1 * t) +
      0.3 * Math.sin(2 * Math.PI * 11.3 * t + 1.1) +
      0.2 * Math.sin(2 * Math.PI * 5.3 * t + 2.3);
    return drift + noise * fWaves;
  }

  private push(value: number): void {
    this.samples[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this.filled < this.capacity) this.filled += 1;
  }
}
