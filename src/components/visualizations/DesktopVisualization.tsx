import { Activity, Heart } from "lucide-react";

import HeartAnimation from "@/components/HeartAnimation";
import LungsAnimation from "@/components/LungsAnimation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Pulse } from "@/lib/pulse";
import { breathsPerMinute, type Rhythm } from "@/lib/rhythms";

interface DesktopVisualizationProps {
  rhythm: Rhythm;
  isPlaying: boolean;
  pulse: Pulse | null;
}

export default function DesktopVisualization({
  rhythm,
  isPlaying,
  pulse,
}: DesktopVisualizationProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" aria-hidden="true" /> Corazón
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {rhythm.bpm} lpm
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <HeartAnimation rhythm={rhythm} isPlaying={isPlaying} pulse={pulse} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" aria-hidden="true" /> Pulmones
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {breathsPerMinute(rhythm)} rpm
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <LungsAnimation rhythm={rhythm} isPlaying={isPlaying} />
        </CardContent>
      </Card>
    </div>
  );
}
