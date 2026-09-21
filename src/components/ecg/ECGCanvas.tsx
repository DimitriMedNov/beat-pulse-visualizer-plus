import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

import { useTheme } from "@/components/theme/theme-context";
import { cn } from "@/lib/utils";
import { annotationsFor } from "@/lib/annotations";
import { ECGEngine, SAMPLE_RATE, WINDOW_SECONDS, type BeatEvent } from "@/lib/ecgEngine";
import {
  gridMetrics,
  isMajor,
  millisecondsBetween,
  rateFromInterval,
  SMALL_MV,
} from "@/lib/ecgGrid";
import type { Rhythm } from "@/lib/rhythms";

interface ECGCanvasProps {
  rhythm: Rhythm;
  isPlaying: boolean;
  /** Se llama una vez por latido iniciado, con lo que fue ese latido. */
  onBeat?: (event: BeatEvent) => void;
  /** Cambiar este valor reinicia el trazo. */
  resetKey?: number;
  /**
   * Dibuja el trazo en un color sin identidad. En el modo examen cada ritmo
   * tiene su color y eso bastaría para adivinar la respuesta sin leer la onda.
   */
  neutralColor?: boolean;
  /**
   * Permite arrastrar sobre el trazo para medir un intervalo. Sólo en el modo
   * explorar: en examen estorba más de lo que ayuda.
   */
  calipers?: boolean;
  /**
   * Señala sobre el trazo lo que identifica al ritmo. En el examen se enciende
   * al revelar la respuesta, que es cuando enseña algo: saber que era una
   * fibrilación no sirve de nada si no ves dónde tendrían que estar las P.
   */
  annotate?: boolean;
}

/** Rango vertical en "mV" que cubre el gráfico. La onda R vale 1. */
const Y_MIN = -0.7;
const Y_MAX = 1.5;

/** Dibuja las marcas que explican el ritmo: corchetes de intervalo y puntos. */
function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  engine: ECGEngine,
  width: number,
  height: number,
  styles: CSSStyleDeclaration,
): void {
  const annotations = annotationsFor(
    engine.rhythmId,
    engine.beatMarks(),
    SAMPLE_RATE,
    engine.length,
  );
  if (annotations.length === 0) return;

  const color = styles.getPropertyValue("--ecg-annotation").trim() || "currentColor";
  const background = styles.getPropertyValue("--ecg-label-bg").trim() || "#fff";
  const toX = (sample: number) => (sample / Math.max(engine.length - 1, 1)) * width;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.textAlign = "center";

  // Extremos ya ocupados por una etiqueta en cada fila, para poder apartar la
  // siguiente en vez de dejar que se pisen.
  const taken: Record<string, { from: number; to: number; level: number }[]> = {
    top: [],
    bottom: [],
  };

  for (const annotation of annotations) {
    const y = annotation.row === "top" ? height * 0.13 : height * 0.87;
    const from = toX(annotation.from);
    const to = toX(annotation.to);

    ctx.beginPath();
    if (annotation.kind === "interval") {
      // Corchete: una barra con dos topes verticales.
      ctx.moveTo(from, y - 5);
      ctx.lineTo(from, y + 5);
      ctx.moveTo(from, y);
      ctx.lineTo(to, y);
      ctx.moveTo(to, y - 5);
      ctx.lineTo(to, y + 5);
    } else {
      // Punto: un círculo con una patita hacia el trazo.
      const tail = annotation.row === "top" ? 9 : -9;
      ctx.moveTo(from, y);
      ctx.lineTo(from, y + tail);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(from, y, 3.5, 0, Math.PI * 2);
    }
    ctx.stroke();

    const centre = Math.min(Math.max((from + to) / 2, 4), width - 4);
    const textWidth = ctx.measureText(annotation.label).width;
    const clamped = Math.min(Math.max(centre, textWidth / 2 + 4), width - textWidth / 2 - 4);

    // Si la etiqueta se solapa con otra ya puesta en su fila, sube o baja un
    // renglón hasta encontrar sitio.
    const span = { from: clamped - textWidth / 2 - 4, to: clamped + textWidth / 2 + 4 };
    const row = taken[annotation.row];
    let level = 0;
    while (row.some((other) => other.level === level && other.from < span.to && span.from < other.to)) {
      level += 1;
    }
    row.push({ ...span, level });

    const away = annotation.row === "top" ? -1 : 1;
    const labelY = y + away * (9 + level * 15);

    ctx.globalAlpha = 0.85;
    ctx.fillStyle = background;
    ctx.fillRect(span.from, labelY - (annotation.row === "top" ? 12 : 1), textWidth + 8, 14);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.textBaseline = annotation.row === "top" ? "bottom" : "top";
    ctx.fillText(annotation.label, clamped, labelY);
  }

  ctx.restore();
}

export default function ECGCanvas({
  rhythm,
  isPlaying,
  onBeat,
  resetKey = 0,
  neutralColor = false,
  calipers = false,
  annotate = false,
}: ECGCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ECGEngine | null>(null);
  const onBeatRef = useRef(onBeat);
  const rhythmRef = useRef(rhythm);
  const sizeRef = useRef({ width: 0, height: 0 });
  const neutralRef = useRef(neutralColor);
  /** Las dos marcas del calibrador, en píxeles del lienzo. */
  const calipersRef = useRef<{ from: number; to: number } | null>(null);
  const draggingRef = useRef(false);
  const annotateRef = useRef(annotate);

  neutralRef.current = neutralColor;
  annotateRef.current = annotate;
  const drawRef = useRef<() => void>(() => {});

  const { resolvedTheme } = useTheme();

  // El callback vive en un ref para que cambiar su identidad en cada render del
  // padre no reinicie el bucle de animación.
  useEffect(() => {
    onBeatRef.current = onBeat;
  }, [onBeat]);

  // El motor avisa de cada latido en cuanto empieza, con su morfología. Así el
  // sonido y el contador no tienen que sondear nada.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.onBeatStarted = (event) => onBeatRef.current?.(event);
    return () => {
      engine.onBeatStarted = null;
    };
  }, []);

  if (engineRef.current === null) {
    engineRef.current = new ECGEngine(rhythm);
  }

  // Dibujo. Se guarda en un ref para poder invocarlo desde el observer de tamaño
  // y desde el bucle sin recrear ninguno de los dos.
  useEffect(() => {
    drawRef.current = () => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine) return;

      const ctx = canvas.getContext("2d");
      const { width, height } = sizeRef.current;
      if (!ctx || width === 0 || height === 0) return;

      const styles = getComputedStyle(canvas);
      const minorColor =
        styles.getPropertyValue("--ecg-grid-minor").trim() || "rgba(0,0,0,.06)";
      const majorColor =
        styles.getPropertyValue("--ecg-grid-major").trim() || "rgba(0,0,0,.14)";
      const bodyColor = styles.getPropertyValue("--ecg-label-bg").trim() || "#fff";
      const traceColor = neutralRef.current
        ? styles.getPropertyValue("--ecg-neutral").trim() || "currentColor"
        : rhythmRef.current.color;

      ctx.clearRect(0, 0, width, height);

      const toY = (value: number) => height - ((value - Y_MIN) / (Y_MAX - Y_MIN)) * height;

      const grid = gridMetrics(width, height, WINDOW_SECONDS, Y_MIN, Y_MAX);

      /**
       * Una pasada de la rejilla. `big` elige las líneas marcadas; las otras son
       * las finas. La columna y la fila cero caen en 0 s y en 0 mV, así que la
       * línea isoeléctrica siempre es una de las marcadas.
       */
      const gridPass = (big: boolean) => {
        ctx.beginPath();
        for (let i = 0; i <= grid.columns; i += 1) {
          if (isMajor(i) !== big) continue;
          const x = Math.round(i * grid.smallX) + 0.5;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let k = grid.firstRow; k <= grid.lastRow; k += 1) {
          if (isMajor(k) !== big) continue;
          const y = Math.round(toY(k * SMALL_MV)) + 0.5;
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      };

      ctx.lineWidth = 1;
      if (grid.showMinor) {
        ctx.strokeStyle = minorColor;
        gridPass(false);
      }
      ctx.strokeStyle = majorColor;
      gridPass(true);

      // Trazo.
      const count = engine.length;
      if (count < 2) return;

      ctx.strokeStyle = traceColor;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      const xScale = width / (count - 1);
      for (let i = 0; i < count; i += 1) {
        const x = i * xScale;
        const y = toY(engine.at(i));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Punto guía en el extremo más reciente.
      ctx.fillStyle = traceColor;
      ctx.beginPath();
      ctx.arc(width, toY(engine.at(count - 1)), 3, 0, Math.PI * 2);
      ctx.fill();

      if (annotateRef.current) {
        drawAnnotations(ctx, engine, width, height, styles);
      }

      const marks = calipersRef.current;
      if (marks === null) return;

      const caliperColor =
        styles.getPropertyValue("--ecg-caliper").trim() || majorColor;
      const left = Math.min(marks.from, marks.to);
      const right = Math.max(marks.from, marks.to);
      const ms = millisecondsBetween(marks.from, marks.to, width, WINDOW_SECONDS);

      ctx.save();
      ctx.strokeStyle = caliperColor;
      ctx.fillStyle = caliperColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (const x of [left, right]) {
        const px = Math.round(x) + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
      }
      ctx.stroke();

      // Barra que une las dos marcas, para que se lea como una medida.
      ctx.setLineDash([]);
      const bar = 18;
      ctx.beginPath();
      ctx.moveTo(left, bar);
      ctx.lineTo(right, bar);
      ctx.stroke();

      const label =
        ms >= 1 ? `${Math.round(ms)} ms · ${Math.round(rateFromInterval(ms))} lpm` : "0 ms";
      ctx.font = "600 12px system-ui, sans-serif";
      ctx.textBaseline = "bottom";
      ctx.textAlign = "center";
      const centre = Math.min(Math.max((left + right) / 2, 46), width - 46);
      const textWidth = ctx.measureText(label).width;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = bodyColor;
      ctx.fillRect(centre - textWidth / 2 - 5, bar - 18, textWidth + 10, 16);
      ctx.globalAlpha = 1;
      ctx.fillStyle = caliperColor;
      ctx.fillText(label, centre, bar - 4);
      ctx.restore();
    };
  }, [resolvedTheme]);

  // Tamaño del lienzo, ajustado a la densidad de píxeles de la pantalla.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width: rect.width, height: rect.height };
      drawRef.current();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Cambio de ritmo o de frecuencia: se aplica en marcha, sin borrar el trazo.
  // Arrastrar el deslizador no debe limpiar la pantalla en cada paso.
  useEffect(() => {
    rhythmRef.current = rhythm;
    engineRef.current?.updateRhythm(rhythm);
    drawRef.current();
  }, [rhythm]);

  // Reinicio explícito: botón Reiniciar o clic en un ritmo del selector.
  useEffect(() => {
    engineRef.current?.setRhythm(rhythmRef.current);
    drawRef.current();
  }, [resetKey]);

  // Redibuja al cambiar de tema o de modo, aunque esté en pausa.
  useEffect(() => {
    drawRef.current();
  }, [resolvedTheme, neutralColor, annotate]);

  // Bucle de animación. Nada de estado de React aquí dentro: sólo el motor y el
  // lienzo, así que la señal avanza sin re-renderizar el árbol.
  useEffect(() => {
    if (!isPlaying) {
      drawRef.current();
      return;
    }

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const engine = engineRef.current;
      if (engine) {
        engine.advance((now - last) / 1000);
        last = now;
        drawRef.current();
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  // Al salir del modo explorar las marcas sobran, así que se limpian solas.
  useEffect(() => {
    if (!calipers) {
      calipersRef.current = null;
      draggingRef.current = false;
      drawRef.current();
    }
  }, [calipers]);

  /** Posición horizontal del puntero dentro del lienzo, acotada a su ancho. */
  const localX = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!calipers) return;
    const x = localX(event);
    calipersRef.current = { from: x, to: x };
    draggingRef.current = true;
    // La captura mantiene vivo el arrastre aunque el dedo o el ratón se salgan.
    event.currentTarget.setPointerCapture(event.pointerId);
    drawRef.current();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current || calipersRef.current === null) return;
    calipersRef.current = { ...calipersRef.current, to: localX(event) };
    drawRef.current();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const marks = calipersRef.current;
    // Un toque sin arrastre quita las marcas, que es la forma natural de
    // borrarlas sin añadir otro botón.
    if (marks !== null && Math.abs(marks.to - marks.from) < 4) calipersRef.current = null;
    drawRef.current();
  };

  return (
    <canvas
      ref={canvasRef}
      className={cn("ecg-canvas block h-full w-full", calipers && "cursor-col-resize touch-pan-y")}
      role="img"
      aria-label={`Trazo de electrocardiograma: ${rhythm.label}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
