
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

import PageLayout from "@/components/layout/PageLayout";
import SimulationControls from "@/components/controls/SimulationControls";
import RhythmInfo from "@/components/RhythmInfo";
import ECGVisualization from "@/components/visualizations/ECGVisualization";
import MobileVisualization from "@/components/visualizations/MobileVisualization";
import DesktopVisualization from "@/components/visualizations/DesktopVisualization";

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedRhythm, setSelectedRhythm] = useState<string>("normal");
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("heart");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    toast({
      title: !isPlaying ? "Simulación iniciada" : "Simulación pausada",
      description: !isPlaying 
        ? `Mostrando ritmo cardíaco: ${getRhythmLabel(selectedRhythm)}` 
        : "La simulación ha sido pausada",
      duration: 2000,
    });
  };

  const handleRhythmChange = (type: string) => {
    setSelectedRhythm(type);
    setCyclesCompleted(0);
    
    toast({
      title: "Ritmo cambiado",
      description: `Ahora mostrando: ${getRhythmLabel(type)}`,
      duration: 2000,
    });
  };

  const handleReset = () => {
    setCyclesCompleted(0);
    
    toast({
      title: "Simulación reiniciada",
      description: "Los ciclos han sido reiniciados a cero",
      duration: 2000,
    });
  };

  const handleCycleComplete = () => {
    setCyclesCompleted(prev => prev + 1);
  };

  const getRhythmLabel = (type: string): string => {
    switch (type) {
      case "normal": return "Normal";
      case "bradycardia": return "Bradicardia";
      case "tachycardia": return "Taquicardia";
      case "arrhythmia": return "Arritmia";
      default: return "Desconocido";
    }
  };

  // Force rerender on initial load to ensure mobile detection works
  useEffect(() => {
    const timer = setTimeout(() => {
      // This will trigger a rerender
      setCyclesCompleted(0);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageLayout>
      <div className="grid grid-cols-1 gap-2 sm:gap-4">
        {/* Controls */}
        <div className="w-full">
          <SimulationControls
            isPlaying={isPlaying}
            selectedRhythm={selectedRhythm}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            onSelectRhythm={handleRhythmChange}
          />
        </div>

        {/* ECG Graph */}
        <div className="w-full">
          <ECGVisualization
            rhythmType={selectedRhythm}
            isPlaying={isPlaying}
            cyclesCompleted={cyclesCompleted}
            onCycleComplete={handleCycleComplete}
          />
        </div>

        {/* Info */}
        <div className="w-full">
          <RhythmInfo rhythmType={selectedRhythm} />
        </div>

        {/* Visualization - For mobile, use tabs; for desktop, show both side by side */}
        <div className="w-full">
          {isMobile ? (
            <MobileVisualization
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              rhythmType={selectedRhythm}
              isPlaying={isPlaying}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DesktopVisualization
                rhythmType={selectedRhythm}
                isPlaying={isPlaying}
              />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default Index;
