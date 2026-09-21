import type { ReactNode } from "react";
import { Heart } from "lucide-react";

import SoundToggle from "@/components/sound/SoundToggle";
import ThemeToggle from "@/components/theme/ThemeToggle";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b px-3 py-2 sm:px-4 sm:py-4">
        <div className="container mx-auto flex items-center gap-2">
          <h1 className="flex items-center gap-1 text-lg font-semibold sm:gap-2 sm:text-xl md:text-3xl">
            <Heart className="h-4 w-4 text-medical-heart sm:h-5 sm:w-5" aria-hidden="true" />
            <span>Simulador de Ritmo Cardíaco</span>
          </h1>
          <div className="ml-auto flex items-center gap-1">
            <SoundToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-2 py-2 sm:px-4 sm:py-4">{children}</main>

      <footer className="border-t px-2 py-2 sm:px-4 sm:py-3">
        <div className="container mx-auto space-y-1 text-center text-xs text-muted-foreground sm:text-sm">
          <p>
            Visualización educativa. No es un dispositivo médico y no lee ninguna señal real de
            ningún paciente.
          </p>
          <p>© 2025 Simulador de Ritmo Cardíaco</p>
        </div>
      </footer>
    </div>
  );
}
