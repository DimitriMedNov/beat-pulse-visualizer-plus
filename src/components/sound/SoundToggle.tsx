import { Volume2, VolumeX } from "lucide-react";

import { useSound } from "@/components/sound/sound-context";
import { Button } from "@/components/ui/button";

export default function SoundToggle() {
  const { enabled, setEnabled } = useSound();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setEnabled(!enabled)}
      aria-pressed={enabled}
      aria-label={enabled ? "Silenciar los latidos" : "Oír los latidos"}
      title={enabled ? "Silenciar" : "Oír los latidos"}
    >
      {enabled ? (
        <Volume2 className="h-5 w-5" aria-hidden="true" />
      ) : (
        <VolumeX className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      )}
    </Button>
  );
}
