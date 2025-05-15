
import React from "react";
import { Heart } from "lucide-react";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="py-4 px-4 sm:px-6 border-b border-gray-200">
        <div className="container mx-auto flex items-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 flex items-center gap-2">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-medical-heart" />
            <span>Simulador de Ritmo Cardíaco</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-4 px-4 sm:py-6 sm:px-6">
        {children}
      </main>

      <footer className="py-3 px-4 sm:px-6 border-t border-gray-200 bg-white">
        <div className="container mx-auto text-center text-sm text-gray-500">
          © 2025 Simulador de Ritmo Cardíaco
        </div>
      </footer>
    </div>
  );
}
