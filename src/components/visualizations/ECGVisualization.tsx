
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
    <Card className="col-span-1 lg:col-span-2 w-full shadow-sm border border-gray-200">
      <CardHeader className="bg-white border-b border-gray-200 p-2 sm:p-4">
        <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
          <span>Electrocardiograma</span>
          <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1 sm:ml-2">
            {getRhythmLabel(rhythmType)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[180px] sm:h-[220px] md:h-[300px] p-0 bg-white">
          <ECGGraph
            rhythmType={rhythmType}
            isPlaying={isPlaying}
            onCycleComplete={onCycleComplete}
          />
        </div>
        
        <div className="p-2 sm:p-3 bg-white flex flex-wrap justify-between items-center gap-1 sm:gap-2 text-xs sm:text-sm border-t border-gray-200">
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
