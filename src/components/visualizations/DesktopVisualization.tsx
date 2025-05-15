
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Activity } from "lucide-react";
import HeartAnimation from "@/components/HeartAnimation";
import LungsAnimation from "@/components/LungsAnimation";

interface DesktopVisualizationProps {
  rhythmType: string;
  isPlaying: boolean;
}

export default function DesktopVisualization({
  rhythmType,
  isPlaying
}: DesktopVisualizationProps) {
  return (
    <>
      {/* Heart animation */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" /> Corazón
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <HeartAnimation rhythmType={rhythmType} isPlaying={isPlaying} />
        </CardContent>
      </Card>

      {/* Lungs animation */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" /> Pulmones
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <LungsAnimation isPlaying={isPlaying} />
        </CardContent>
      </Card>
    </>
  );
}
