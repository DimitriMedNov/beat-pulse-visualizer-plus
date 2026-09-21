import { Slider } from "@/components/ui/slider";
import {
  BPM_MAX,
  BPM_MIN,
  BRADYCARDIA_BELOW,
  TACHYCARDIA_ABOVE,
  type Rhythm,
} from "@/lib/rhythms";

interface RateControlProps {
  rhythm: Rhythm;
  onChange: (bpm: number) => void;
}

/** Posición de un valor dentro del recorrido, en porcentaje. */
const position = (bpm: number) => ((bpm - BPM_MIN) / (BPM_MAX - BPM_MIN)) * 100;

const NORMAL_LEFT = position(BRADYCARDIA_BELOW);
const NORMAL_WIDTH = position(TACHYCARDIA_ABOVE) - NORMAL_LEFT;

export default function RateControl({ rhythm, onChange }: RateControlProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor="rate" className="text-lg font-medium">
          Frecuencia
        </label>
        <span className="text-sm tabular-nums text-muted-foreground">
          <span className="text-base font-bold text-foreground">{rhythm.bpm}</span> lpm
        </span>
      </div>

      <Slider
        id="rate"
        min={BPM_MIN}
        max={BPM_MAX}
        step={1}
        value={[rhythm.bpm]}
        onValueChange={([bpm]) => onChange(bpm)}
        aria-label="Frecuencia cardíaca en latidos por minuto"
        aria-valuetext={`${rhythm.bpm} latidos por minuto`}
      />

      {/* Guía de la zona normal bajo el carril: hace visible dónde está la
          frontera mientras arrastras. Es orientativa; el valor exacto es el
          número de arriba. */}
      <div aria-hidden="true" className="relative mt-2 h-1">
        <div className="absolute inset-0 rounded-full bg-muted" />
        <div
          className="absolute h-full rounded-full bg-medical-normal"
          style={{ left: `${NORMAL_LEFT}%`, width: `${NORMAL_WIDTH}%` }}
        />
      </div>

      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{BPM_MIN}</span>
        <span>
          zona normal {BRADYCARDIA_BELOW}-{TACHYCARDIA_ABOVE}
        </span>
        <span>{BPM_MAX}</span>
      </div>
    </div>
  );
}
