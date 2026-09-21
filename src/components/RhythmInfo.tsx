import { Heart } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Rhythm } from "@/lib/rhythms";

interface RhythmInfoProps {
  rhythm: Rhythm;
}

export default function RhythmInfo({ rhythm }: RhythmInfoProps) {
  return (
    <Card className="h-full w-full">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <Heart className="h-5 w-5 shrink-0" style={{ color: rhythm.color }} aria-hidden="true" />
        <div>
          <CardTitle>{rhythm.title}</CardTitle>
          <CardDescription>{rhythm.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{rhythm.info}</p>
      </CardContent>
    </Card>
  );
}
