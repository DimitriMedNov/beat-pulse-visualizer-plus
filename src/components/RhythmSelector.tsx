
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RhythmSelectorProps {
  selectedRhythm: string;
  onSelectRhythm: (type: string) => void;
}

export default function RhythmSelector({ selectedRhythm, onSelectRhythm }: RhythmSelectorProps) {
  const rhythmTypes = [
    { id: "normal", label: "Normal", description: "Regular rhythm, 60-100 beats per minute" },
    { id: "bradycardia", label: "Bradicardia", description: "Slow rhythm, <60 beats per minute" },
    { id: "tachycardia", label: "Taquicardia", description: "Fast rhythm, >100 beats per minute" },
    { id: "arrhythmia", label: "Arritmia", description: "Irregular rhythm pattern" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {rhythmTypes.map((rhythm) => (
        <Button
          key={rhythm.id}
          onClick={() => onSelectRhythm(rhythm.id)}
          className={cn(
            "h-auto py-4 flex flex-col items-center transition-all duration-200",
            selectedRhythm === rhythm.id
              ? "bg-primary text-primary-foreground shadow-md scale-105"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
          variant={selectedRhythm === rhythm.id ? "default" : "secondary"}
        >
          <span className="font-medium">{rhythm.label}</span>
        </Button>
      ))}
    </div>
  );
}
