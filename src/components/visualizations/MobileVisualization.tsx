
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
    <Card className="col-span-1">
      <CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="heart" className="flex items-center gap-2">
              <Heart className="h-4 w-4" /> Corazón
            </TabsTrigger>
            <TabsTrigger value="lungs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Pulmones
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <TabsContent value="heart" className="h-[300px]">
          <HeartAnimation rhythmType={rhythmType} isPlaying={isPlaying} />
        </TabsContent>
        <TabsContent value="lungs" className="h-[300px]">
          <LungsAnimation isPlaying={isPlaying} />
        </TabsContent>
      </CardContent>
    </Card>
  );
}
