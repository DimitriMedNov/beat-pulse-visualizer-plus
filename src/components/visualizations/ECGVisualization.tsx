
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ECGGraph from "@/components/ECGGraph";
import { useIsMobile } from "@/hooks/use-mobile";

interface ECGVisualizationProps {
  rhythmType: string;
  isPlaying: boolean;
  cyclesCompleted: number;
  onCycleComplete: () => void;
}

export default function ECGVisualization({
  rhythmType,
  isPlaying,
  cyclesCompleted,
  onCycleComplete
}: ECGVisualizationProps) {
  const isMobile = useIsMobile();
  
  const getRhythmLabel = (type: string): string => {
    switch (type) {
      case "normal": return "Normal";
      case "bradycardia": return "Bradicardia";
      case "tachycardia": return "Taquicardia";
      case "arrhythmia": return "Arritmia";
      default: return "Desconocido";
    }
  };

  // Get heart rate value based on rhythm type
  const getHeartRate = (type: string): string => {
    switch (type) {
      case "normal": return "75";
      case "bradycardia": return "45";
      case "tachycardia": return "120";
      case "arrhythmia": return "Irregular";
      default: return "Unknown";
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2 w-full">
      <CardHeader className="bg-card border-b border-border p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
          <span>Electrocardiograma</span>
          <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-2">
            {getRhythmLabel(rhythmType)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[200px] sm:h-[300px] p-1 bg-card">
          <ECGGraph
            rhythmType={rhythmType}
            isPlaying={isPlaying}
            onCycleComplete={onCycleComplete}
          />
        </div>
        
        <div className="p-2 sm:p-4 bg-card flex flex-wrap justify-between items-center gap-2 text-xs sm:text-sm">
          <div>
            <span className="font-medium">Frecuencia:</span>{" "}
            <span className="font-bold">
              {getHeartRate(rhythmType)}{" "}
              {rhythmType !== "arrhythmia" && "BPM"}
            </span>
          </div>
          <div>
            <span className="font-medium">Ciclos completados:</span>{" "}
            <span className="font-bold">{cyclesCompleted}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
