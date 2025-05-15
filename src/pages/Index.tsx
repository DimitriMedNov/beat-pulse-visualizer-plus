
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Stop, Lungs, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

import ECGGraph from "@/components/ECGGraph";
import HeartAnimation from "@/components/HeartAnimation";
import LungsAnimation from "@/components/LungsAnimation";
import RhythmSelector from "@/components/RhythmSelector";
import RhythmInfo from "@/components/RhythmInfo";

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="py-6 px-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="container flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-6 w-6 text-medical-heart" />
            Simulador de Ritmo Cardíaco
          </h1>
        </div>
      </header>

      <main className="flex-1 container py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Controls and Info */}
          <div className="space-y-6">
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Controles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={handlePlayPause}
                    variant={isPlaying ? "destructive" : "default"}
                    size="lg"
                    className="w-full text-lg py-6"
                  >
                    {isPlaying ? (
                      <>
                        <Stop className="mr-2 h-5 w-5" /> Detener
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" /> Iniciar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                    className="py-6"
                  >
                    Reiniciar
                  </Button>
                </div>

                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Seleccionar Ritmo</h3>
                  <RhythmSelector
                    selectedRhythm={selectedRhythm}
                    onSelectRhythm={handleRhythmChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Info */}
            <div className="h-[280px]">
              <RhythmInfo rhythmType={selectedRhythm} />
            </div>
          </div>

          {/* Column 2: ECG Graph */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Electrocardiograma</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {getRhythmLabel(selectedRhythm)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[300px]">
                <ECGGraph
                  rhythmType={selectedRhythm}
                  isPlaying={isPlaying}
                  onCycleComplete={handleCycleComplete}
                />
              </div>
              
              <div className="p-4 bg-muted/50 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <span className="text-sm font-medium">Frecuencia:</span>{" "}
                  <span className="font-bold">
                    {selectedRhythm === "normal" && "75"}
                    {selectedRhythm === "bradycardia" && "45"}
                    {selectedRhythm === "tachycardia" && "120"}
                    {selectedRhythm === "arrhythmia" && "Irregular"}{" "}
                    {selectedRhythm !== "arrhythmia" && "BPM"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Ciclos completados:</span>{" "}
                  <span className="font-bold">{cyclesCompleted}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visualization - For mobile, use tabs; for desktop, show both side by side */}
          <div className="col-span-1 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isMobile ? (
              <Card className="col-span-1">
                <CardHeader>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="heart" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" /> Corazón
                      </TabsTrigger>
                      <TabsTrigger value="lungs" className="flex items-center gap-2">
                        <Lungs className="h-4 w-4" /> Pulmones
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  <TabsContent value="heart" className="h-[300px]">
                    <HeartAnimation rhythmType={selectedRhythm} isPlaying={isPlaying} />
                  </TabsContent>
                  <TabsContent value="lungs" className="h-[300px]">
                    <LungsAnimation isPlaying={isPlaying} />
                  </TabsContent>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Heart animation */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-medical-heart" /> Corazón
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <HeartAnimation rhythmType={selectedRhythm} isPlaying={isPlaying} />
                  </CardContent>
                </Card>

                {/* Lungs animation */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lungs className="h-5 w-5 text-medical-lungs" /> Pulmones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <LungsAnimation isPlaying={isPlaying} />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 px-4 border-t border-slate-200 bg-white">
        <div className="container text-center text-sm text-muted-foreground">
          © 2025 Simulador de Ritmo Cardíaco | Desarrollado con tecnología avanzada
        </div>
      </footer>
    </div>
  );
};

export default Index;
