import ECGCanvas from "@/components/ecg/ECGCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BeatEvent } from "@/lib/ecgEngine";
import { plainRateLabel, rateLabel, type Rhythm } from "@/lib/rhythms";

interface ECGVisualizationProps {
  rhythm: Rhythm;
  isPlaying: boolean;
  beatCount: number;
  onBeat: (event: BeatEvent) => void;
  resetKey: number;
  /**
   * En examen el nombre del ritmo y el color del trazo se esconden hasta
   * responder: los dos delatarían la respuesta sin necesidad de leer la onda.
   */
  hideIdentity?: boolean;
  /** En examen no hay calibrador: mide bien, pero ahí estorba. */
  examMode?: boolean;
}

export default function ECGVisualization({
  rhythm,
  isPlaying,
  beatCount,
  onBeat,
  resetKey,
  hideIdentity = false,
  examMode = false,
}: ECGVisualizationProps) {
  return (
    <Card className="w-full">
      <CardHeader className="border-b p-2 sm:p-4">
        <CardTitle className="flex items-center text-base font-semibold sm:text-lg">
          <span>Electrocardiograma</span>
          <span className="ml-1 text-xs font-normal text-muted-foreground sm:ml-2 sm:text-sm">
            {hideIdentity ? "¿qué ritmo es?" : rhythm.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[180px] sm:h-[220px] md:h-[300px]">
          <ECGCanvas
            rhythm={rhythm}
            isPlaying={isPlaying}
            onBeat={onBeat}
            resetKey={resetKey}
            neutralColor={hideIdentity}
            calipers={!examMode}
          />
        </div>

        {!examMode && (
          <p className="border-t px-2 pt-2 text-xs text-muted-foreground sm:px-3">
            Arrastra sobre el trazo para medir un intervalo.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-1 border-t p-2 text-xs sm:gap-2 sm:p-3 sm:text-sm">
          <div>
            <span className="font-medium">Frecuencia:</span>{" "}
            <span className="font-bold">
              {hideIdentity ? plainRateLabel(rhythm) : rateLabel(rhythm)}
            </span>
          </div>
          {/* Sin región viva: a 200 lpm serían más de tres anuncios por segundo.
              Lo que cambia y merece anunciarse es el ritmo, y de eso se encarga
              LiveAnnouncer. */}
          <div aria-live="off">
            <span className="font-medium">Latidos:</span>{" "}
            <span className="font-bold tabular-nums">{beatCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
