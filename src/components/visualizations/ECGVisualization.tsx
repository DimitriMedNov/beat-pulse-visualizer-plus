
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ECGGraph from "@/components/ECGGraph";
import { Monitor } from "lucide-react";

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

  const getHeartRate = (type: string): string => {
    switch (type) {
      case "normal": return "75";
      case "bradycardia": return "45";
      case "tachycardia": return "120";
      case "arrhythmia": return "Irregular";
      default: return "--";
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2 border-gray-700 bg-gray-900 shadow-md overflow-hidden">
      <CardHeader className="bg-gray-800 border-b border-gray-700">
        <CardTitle className="flex items-center gap-2 text-gray-100">
          <Monitor className="h-5 w-5 text-green-500" />
          <span>ECG Monitor</span>
          <span className="text-sm font-normal text-green-500 ml-auto">
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
        
        <div className="p-4 bg-gray-800 flex flex-wrap justify-between items-center gap-2 text-gray-100 border-t border-gray-700">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-400">Frecuencia:</span>{" "}
            <span className="font-bold text-green-500 ml-2">
              {getHeartRate(rhythmType)}{" "}
              {rhythmType !== "arrhythmia" && "BPM"}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-400">Ciclos:</span>{" "}
            <span className="font-bold text-green-500 ml-2">{cyclesCompleted}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
