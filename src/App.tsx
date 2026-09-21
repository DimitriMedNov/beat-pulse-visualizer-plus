import { BrowserRouter, Route, Routes } from "react-router-dom";

import { SoundProvider } from "@/components/sound/SoundProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SoundProvider>
    </ThemeProvider>
  );
}
