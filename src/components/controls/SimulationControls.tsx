
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Play, Square, RotateCcw } from "lucide-react";
import RhythmSelector from "@/components/RhythmSelector";

interface SimulationControlsProps {
  isPlaying: boolean;
  selectedRhythm: string;
  onPlayPause: () => void;
  onReset: () => void;
  onSelectRhythm: (type: string) => void;
}

export default function SimulationControls({
  isPlaying,
  selectedRhythm,
  onPlayPause,
  onReset,
  onSelectRhythm,
}: SimulationControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Controles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button
            onClick={onPlayPause}
            variant={isPlaying ? "destructive" : "default"}
            size="lg"
            className="w-full text-lg py-6"
          >
            {isPlaying ? (
              <>
                <Square className="mr-2 h-5 w-5" /> Detener
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" /> Iniciar
              </>
            )}
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            size="lg"
            className="py-6"
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Reiniciar
          </Button>
        </div>

        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-2">Seleccionar Ritmo</h3>
          <RhythmSelector
            selectedRhythm={selectedRhythm}
            onSelectRhythm={onSelectRhythm}
          />
        </div>
      </CardContent>
    </Card>
  );
}
