
import { useECGAnimation } from "@/hooks/useECGAnimation";
import ECGChart from "@/components/ECGChart";

interface ECGGraphProps {
  rhythmType: string;
  isPlaying: boolean;
  onCycleComplete?: () => void;
}

export default function ECGGraph({ rhythmType, isPlaying, onCycleComplete }: ECGGraphProps) {
  const data = useECGAnimation({ rhythmType, isPlaying, onCycleComplete });
  
  return (
    <div className="w-full h-full bg-card rounded-md border border-border overflow-hidden">
      <ECGChart data={data} rhythmType={rhythmType} />
    </div>
  );
}
