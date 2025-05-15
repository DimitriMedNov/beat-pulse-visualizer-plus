
import React from "react";
import { Heart } from "lucide-react";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="py-6 px-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="container flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-6 w-6 text-medical-heart" />
            Simulador de Ritmo Cardíaco
          </h1>
        </div>
      </header>

      <main className="flex-1 container py-6 px-4">
        {children}
      </main>

      <footer className="py-4 px-4 border-t border-slate-200 bg-white">
        <div className="container text-center text-sm text-muted-foreground">
          © 2025 Simulador de Ritmo Cardíaco
        </div>
      </footer>
    </div>
  );
}
