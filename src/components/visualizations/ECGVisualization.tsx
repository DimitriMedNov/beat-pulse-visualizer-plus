
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ECGGraph from "@/components/ECGGraph";

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
  
  const getRhythmLabel = (type: string): string => {
    switch (type) {
      case "normal": return "Normal";
      case "bradycardia": return "Bradicardia";
      case "tachycardia": return "Taquicardia";
      case "arrhythmia": return "Arritmia";
      default: return "Desconocido";
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Electrocardiograma</span>
          <span className="text-sm font-normal text-muted-foreground">
            {getRhythmLabel(rhythmType)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px]">
          <ECGGraph
            rhythmType={rhythmType}
            isPlaying={isPlaying}
            onCycleComplete={onCycleComplete}
          />
        </div>
        
        <div className="p-4 bg-muted/50 flex flex-wrap justify-between items-center gap-2">
          <div>
            <span className="text-sm font-medium">Frecuencia:</span>{" "}
            <span className="font-bold">
              {rhythmType === "normal" && "75"}
              {rhythmType === "bradycardia" && "45"}
              {rhythmType === "tachycardia" && "120"}
              {rhythmType === "arrhythmia" && "Irregular"}{" "}
              {rhythmType !== "arrhythmia" && "BPM"}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium">Ciclos completados:</span>{" "}
            <span className="font-bold">{cyclesCompleted}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
