// Qué señalar sobre el trazo para explicar un ritmo.
//
// Acertar en el examen y que te digan "era fibrilación auricular" no enseña
// nada; lo que enseña es ver marcado encima de la onda qué era lo que había que
// mirar. Todo esto es aritmética pura sobre las marcas de latido que devuelve el
// motor, así que se prueba sin lienzo ni navegador.

import type { BeatMark } from "./ecgEngine";
import { complexTiming, P_CENTER_SECONDS, P_ONSET_SECONDS } from "./ecgWaveform";
import type { RhythmId } from "./rhythms";

export interface Annotation {
  /** Un intervalo lleva corchetes a los lados; un punto sólo una marca. */
  kind: "interval" | "point";
  /** Muestras donde empieza y acaba. En un punto las dos coinciden. */
  from: number;
  to: number;
  label: string;
  /** Arriba o abajo del trazo, para que las marcas no se pisen entre sí. */
  row: "top" | "bottom";
}

const milliseconds = (seconds: number) => Math.round(seconds * 1000);
const rate = (seconds: number) => Math.round(60 / seconds);

/**
 * El intervalo R-R completo de un latido.
 *
 * Cuando se marcan varios seguidos la etiqueta va corta: lo que hay que ver ahí
 * es que los números difieren (o que coinciden), no la frecuencia de cada uno, y
 * dos etiquetas largas en intervalos cortos se pisarían. Cuando el intervalo va
 * solo cabe la frecuencia, que en la bradicardia y la taquicardia es justo el
 * dato que hace el diagnóstico.
 */
function rrInterval(
  mark: BeatMark,
  sampleRate: number,
  options: { compact?: boolean; label?: string } = {},
): Annotation {
  const duration = milliseconds(mark.rrSeconds);
  return {
    kind: "interval",
    from: mark.index,
    to: mark.index + Math.round(mark.rrSeconds * sampleRate),
    label:
      options.label ??
      (options.compact ? `RR ${duration} ms` : `RR ${duration} ms · ${rate(mark.rrSeconds)} lpm`),
    row: "bottom",
  };
}

/** Del inicio de la onda P al inicio del QRS. */
function prInterval(mark: BeatMark, sampleRate: number): Annotation {
  const start = mark.index + Math.round(P_ONSET_SECONDS * sampleRate);
  return {
    kind: "interval",
    from: start,
    to: start + Math.round(mark.morphology.prSeconds * sampleRate),
    label: `PR ${milliseconds(mark.morphology.prSeconds)} ms`,
    row: "top",
  };
}

/** Un punto sobre la onda P, o sobre el sitio donde debería estar. */
function atPWave(mark: BeatMark, sampleRate: number, label: string): Annotation {
  const at = mark.index + Math.round(P_CENTER_SECONDS * sampleRate);
  return { kind: "point", from: at, to: at, label, row: "top" };
}

/** Un punto sobre el pico del QRS. */
function atQrs(mark: BeatMark, sampleRate: number, label: string): Annotation {
  const timing = complexTiming(mark.rrSeconds, mark.morphology);
  const peak = timing.qrsOnset + (timing.qrsEnd - timing.qrsOnset) / 3;
  const at = mark.index + Math.round(peak * sampleRate);
  return { kind: "point", from: at, to: at, label, row: "top" };
}

/**
 * La última tanda de latidos en la que el PR va creciendo, o sea un ciclo de
 * Wenckebach. Tomar sin más los últimos tres conducidos mezclaría dos ciclos y
 * saldría 220, 280 y otra vez 160, que no se lee como un alargamiento.
 */
function lastGrowingRun(conducted: readonly BeatMark[], limit = 3): BeatMark[] {
  const run: BeatMark[] = [];
  for (let i = conducted.length - 1; i >= 0 && run.length < limit; i -= 1) {
    const mark = conducted[i];
    const next = run[0];
    if (next !== undefined && mark.morphology.prSeconds >= next.morphology.prSeconds) break;
    run.unshift(mark);
  }
  return run;
}

/**
 * Lo que hay que señalar en cada ritmo. Se eligen los latidos que caben enteros
 * en la ventana, porque marcar un intervalo cortado por el borde confunde más
 * que ayuda.
 */
export function annotationsFor(
  rhythmId: RhythmId,
  marks: readonly BeatMark[],
  sampleRate: number,
  totalSamples: number,
): Annotation[] {
  const complete = marks.filter(
    (mark) => mark.index >= 0 && mark.index + mark.rrSeconds * sampleRate <= totalSamples,
  );
  if (complete.length === 0) return [];

  const last = complete[complete.length - 1];

  switch (rhythmId) {
    case "normal": {
      // Dos intervalos seguidos con el mismo número: eso es "regular".
      const pair = complete.slice(-2);
      return [
        ...pair.map((mark) => rrInterval(mark, sampleRate, { compact: true })),
        prInterval(last, sampleRate),
      ];
    }

    case "bradycardia":
    case "tachycardia":
      // El complejo es idéntico al normal; lo que cambia es el R-R.
      return [rrInterval(last, sampleRate), prInterval(last, sampleRate)];

    case "sinusArrhythmia":
      // Tres intervalos que se alargan y se acortan de forma ondulada.
      return complete.slice(-3).map((mark) => rrInterval(mark, sampleRate, { compact: true }));

    case "atrialFibrillation": {
      const recent = complete.slice(-2);
      return [
        ...recent.map((mark) => rrInterval(mark, sampleRate, { compact: true })),
        atPWave(last, sampleRate, "aquí no hay onda P"),
      ];
    }

    case "pvc": {
      const premature = [...complete].reverse().find((mark) => mark.morphology.qrsWidthScale > 1);
      if (premature === undefined) return [rrInterval(last, sampleRate)];
      return [
        atQrs(premature, sampleRate, "QRS ancho, sin P delante"),
        rrInterval(premature, sampleRate, {
          label: `pausa compensadora ${milliseconds(premature.rrSeconds)} ms`,
        }),
      ];
    }

    case "mobitz1": {
      const conducted = complete.filter((mark) => mark.morphology.hasQrs);
      const dropped = complete.filter((mark) => !mark.morphology.hasQrs);

      if (dropped.length === 0) {
        return lastGrowingRun(conducted).map((mark) => prInterval(mark, sampleRate));
      }

      // De los latidos caídos visibles se elige el que lleve delante la tanda
      // más larga de PR creciente, no simplemente el último: según por dónde
      // quede cortada la ventana, el último puede tener un solo latido delante
      // y entonces no se vería el alargamiento, que es todo el fenómeno.
      let best = { run: [] as BeatMark[], mark: dropped[dropped.length - 1] };
      for (const candidate of dropped) {
        const run = lastGrowingRun(conducted.filter((mark) => mark.index < candidate.index));
        if (run.length > best.run.length) best = { run, mark: candidate };
      }

      return [
        ...best.run.map((mark) => prInterval(mark, sampleRate)),
        atPWave(best.mark, sampleRate, "P sin QRS detrás"),
      ];
    }

    default:
      return [rrInterval(last, sampleRate)];
  }
}
