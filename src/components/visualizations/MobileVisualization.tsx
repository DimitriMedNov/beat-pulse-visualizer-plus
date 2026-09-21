import { Activity, Heart } from "lucide-react";

import HeartAnimation from "@/components/HeartAnimation";
import LungsAnimation from "@/components/LungsAnimation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Pulse } from "@/lib/pulse";
import type { Rhythm } from "@/lib/rhythms";

interface MobileVisualizationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  rhythm: Rhythm;
  isPlaying: boolean;
  pulse: Pulse | null;
}

export default function MobileVisualization({
  activeTab,
  setActiveTab,
  rhythm,
  isPlaying,
  pulse,
}: MobileVisualizationProps) {
  return (
    // <Tabs> tiene que envolver a la lista Y al contenido: TabsContent lee el
    // contexto de Radix y lanza una excepción si queda fuera.
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <Card className="w-full">
        <CardHeader className="border-b p-2 sm:p-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="heart" className="flex items-center gap-1 text-xs sm:text-sm">
              <Heart className="h-3 w-3 text-pink-500 sm:h-4 sm:w-4" aria-hidden="true" /> Corazón
            </TabsTrigger>
            <TabsTrigger value="lungs" className="flex items-center gap-1 text-xs sm:text-sm">
              <Activity className="h-3 w-3 text-blue-500 sm:h-4 sm:w-4" aria-hidden="true" /> Pulmones
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="p-0">
          <TabsContent value="heart" className="mt-0 h-[220px] sm:h-[260px]">
            <HeartAnimation rhythm={rhythm} isPlaying={isPlaying} pulse={pulse} />
          </TabsContent>
          <TabsContent value="lungs" className="mt-0 h-[220px] sm:h-[260px]">
            <LungsAnimation rhythm={rhythm} isPlaying={isPlaying} />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}
