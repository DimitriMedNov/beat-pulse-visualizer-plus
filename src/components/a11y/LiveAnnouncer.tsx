import { useEffect, useState } from "react";

interface LiveAnnouncerProps {
  message: string;
  /**
   * Espera antes de anunciar. Arrastrar el deslizador cambia el mensaje una vez
   * por lpm; sin retardo, un lector de pantalla recibiría una ráfaga.
   */
  delay?: number;
}

/** Anuncia cambios de estado a los lectores de pantalla, sin ocupar pantalla. */
export default function LiveAnnouncer({ message, delay = 700 }: LiveAnnouncerProps) {
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(message), delay);
    return () => window.clearTimeout(timer);
  }, [message, delay]);

  return (
    <p aria-live="polite" className="sr-only">
      {announced}
    </p>
  );
}
