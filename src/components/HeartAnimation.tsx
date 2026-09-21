import { useEffect, useRef } from "react";

import { PR_SECONDS } from "@/lib/ecgWaveform";
import { beatMs, type Rhythm } from "@/lib/rhythms";
import type { Pulse } from "@/lib/pulse";

interface HeartAnimationProps {
  rhythm: Rhythm;
  isPlaying: boolean;
  /** Último latido del motor. Cambiar de `id` dispara una contracción. */
  pulse: Pulse | null;
}

/** Cuánto se encogen las cavidades al contraerse. Sístole = cavidad más pequeña. */
const ATRIAL_SCALE = 0.93;
const VENTRICULAR_SCALE = 0.88;

export default function HeartAnimation({ rhythm, isPlaying, pulse }: HeartAnimationProps) {
  const atriaRef = useRef<SVGGElement | null>(null);
  const ventriclesRef = useRef<SVGGElement | null>(null);
  const rhythmRef = useRef(rhythm);

  rhythmRef.current = rhythm;

  // El diagrama se mueve con los latidos reales del motor, y cada cavidad con lo
  // que le toca: las aurículas en la onda P, los ventrículos tras el intervalo
  // PR. En un latido bloqueado las aurículas se contraen y los ventrículos no,
  // que es exactamente lo que significa el bloqueo.
  useEffect(() => {
    if (!pulse || !isPlaying) return;

    const { event } = pulse;
    const interval = beatMs(rhythmRef.current);
    const running: Animation[] = [];

    /**
     * El retardo va dentro de la animación, no en un `setTimeout`. Un temporizador
     * queda a merced del estrangulamiento del navegador (en una pestaña en
     * segundo plano el mínimo sube a un segundo, y los 160 ms del PR se
     * convertirían en 1000), mientras que la línea de tiempo de la animación es
     * exacta y se cancela con ella.
     */
    const squeeze = (
      element: SVGGElement | null,
      scale: number,
      duration: number,
      delay = 0,
    ) => {
      if (!element || typeof element.animate !== "function") return;
      running.push(
        element.animate(
          [
            { transform: "scale(1)" },
            { transform: `scale(${scale})`, offset: 0.35 },
            { transform: "scale(1)" },
          ],
          { duration, delay, easing: "ease-in-out" },
        ),
      );
    };

    // La extrasístole nace en el ventrículo: no hay onda P que preceda.
    if (!event.ventricular) {
      squeeze(atriaRef.current, ATRIAL_SCALE, Math.min(220, interval * 0.3));
    }

    // Un latido que no conduce deja aquí a los ventrículos quietos: las
    // aurículas se contraen y el ventrículo no responde.
    if (event.conducted) {
      squeeze(
        ventriclesRef.current,
        VENTRICULAR_SCALE,
        Math.min(340, interval * 0.45),
        event.ventricular ? 0 : PR_SECONDS * 1000,
      );
    }

    return () => {
      for (const animation of running) animation.cancel();
    };
  }, [pulse, isPlaying]);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg
        className="h-full w-full max-h-[300px] max-w-[300px]"
        viewBox="0 0 200 200"
        role="img"
        aria-label={`Diagrama del corazón latiendo en ritmo ${rhythm.label.toLowerCase()}`}
      >
        {/* Grandes vasos */}
        <g className="fill-none stroke-muted-foreground/40" strokeWidth="5" strokeLinecap="round">
          <path d="M58,42 V18" />
          <path d="M100,40 C100,22 118,16 130,24" />
          <path d="M142,42 V20" />
        </g>

        {/* Aurículas: se contraen en la onda P */}
        <g ref={atriaRef} className="origin-center-box">
          <rect
            x="38"
            y="42"
            width="56"
            height="46"
            rx="14"
            className="fill-medical-venous/85 stroke-medical-venous"
            strokeWidth="2"
          />
          <rect
            x="106"
            y="42"
            width="56"
            height="46"
            rx="14"
            className="fill-medical-arterial/85 stroke-medical-arterial"
            strokeWidth="2"
          />
          <text x="66" y="70" className="fill-white text-[13px] font-semibold" textAnchor="middle">
            AD
          </text>
          <text x="134" y="70" className="fill-white text-[13px] font-semibold" textAnchor="middle">
            AI
          </text>
        </g>

        {/* Válvulas auriculoventriculares */}
        <g className="stroke-muted-foreground/60" strokeWidth="2.5" strokeLinecap="round">
          <path d="M52,94 L80,94" />
          <path d="M120,94 L148,94" />
        </g>

        {/* Ventrículos: se contraen tras el intervalo PR */}
        <g ref={ventriclesRef} className="origin-center-box">
          <rect
            x="38"
            y="100"
            width="56"
            height="64"
            rx="16"
            className="fill-medical-venous/85 stroke-medical-venous"
            strokeWidth="2"
          />
          {/* La pared del ventrículo izquierdo es notablemente más gruesa. */}
          <rect
            x="106"
            y="100"
            width="56"
            height="70"
            rx="16"
            className="fill-medical-arterial/85 stroke-medical-arterial"
            strokeWidth="6"
          />
          <text x="66" y="138" className="fill-white text-[13px] font-semibold" textAnchor="middle">
            VD
          </text>
          <text x="134" y="141" className="fill-white text-[13px] font-semibold" textAnchor="middle">
            VI
          </text>
        </g>
      </svg>
    </div>
  );
}
