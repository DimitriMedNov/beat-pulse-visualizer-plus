
import React from "react";
import { Heart } from "lucide-react";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="py-2 px-3 sm:py-4 sm:px-4 border-b border-gray-200">
        <div className="container mx-auto flex items-center">
          <h1 className="text-lg sm:text-xl md:text-3xl font-semibold text-gray-900 flex items-center gap-1 sm:gap-2">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-medical-heart" />
            <span>Simulador de Ritmo Cardíaco</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-2 px-2 sm:py-4 sm:px-4">
        {children}
      </main>

      <footer className="py-2 px-2 sm:py-3 sm:px-4 border-t border-gray-200 bg-white">
        <div className="container mx-auto text-center text-xs sm:text-sm text-gray-500">
          © 2025 Simulador de Ritmo Cardíaco
        </div>
      </footer>
    </div>
  );
}
