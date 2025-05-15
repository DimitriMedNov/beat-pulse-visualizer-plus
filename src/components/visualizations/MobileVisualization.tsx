
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Activity } from "lucide-react";
import HeartAnimation from "@/components/HeartAnimation";
import LungsAnimation from "@/components/LungsAnimation";

interface MobileVisualizationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  rhythmType: string;
  isPlaying: boolean;
}

export default function MobileVisualization({
  activeTab,
  setActiveTab,
  rhythmType,
  isPlaying
}: MobileVisualizationProps) {
  return (
    <Card className="col-span-1 w-full">
      <CardHeader className="p-2 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="heart" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-pink-500" /> Corazón
            </TabsTrigger>
            <TabsTrigger value="lungs" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" /> Pulmones
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0 sm:p-2">
        <TabsContent value="heart" className="h-[200px] sm:h-[300px] mt-0">
          <HeartAnimation rhythmType={rhythmType} isPlaying={isPlaying} />
        </TabsContent>
        <TabsContent value="lungs" className="h-[200px] sm:h-[300px] mt-0">
          <LungsAnimation isPlaying={isPlaying} />
        </TabsContent>
      </CardContent>
    </Card>
  );
}
