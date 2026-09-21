import { Compass, GraduationCap } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Mode = "explore" | "exam";

interface ModeSwitchProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export default function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <Tabs value={mode} onValueChange={(value) => onChange(value as Mode)}>
      <TabsList className="grid w-full grid-cols-2 sm:inline-grid sm:w-auto">
        <TabsTrigger value="explore" className="flex items-center gap-2 px-6">
          <Compass className="h-4 w-4" aria-hidden="true" /> Explorar
        </TabsTrigger>
        <TabsTrigger value="exam" className="flex items-center gap-2 px-6">
          <GraduationCap className="h-4 w-4" aria-hidden="true" /> Examen
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
