
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
    <Card className="col-span-1 w-full shadow-sm border border-gray-200">
      <CardHeader className="p-2 sm:p-3 bg-white border-b border-gray-200">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger value="heart" className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-white">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-pink-500" /> Corazón
            </TabsTrigger>
            <TabsTrigger value="lungs" className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-white">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" /> Pulmones
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0">
        <TabsContent value="heart" className="h-[180px] sm:h-[200px] md:h-[260px] mt-0">
          <HeartAnimation rhythmType={rhythmType} isPlaying={isPlaying} />
        </TabsContent>
        <TabsContent value="lungs" className="h-[180px] sm:h-[200px] md:h-[260px] mt-0">
          <LungsAnimation isPlaying={isPlaying} />
        </TabsContent>
      </CardContent>
    </Card>
  );
}
