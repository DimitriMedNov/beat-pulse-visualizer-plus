import type { BeatEvent } from "./ecgEngine";

/**
 * Un latido concreto, con identidad propia. El `id` cambia en cada latido para
 * que los componentes puedan reaccionar aunque el evento sea idéntico al
 * anterior.
 */
export interface Pulse {
  id: number;
  event: BeatEvent;
}

export function nextPulse(previous: Pulse | null, event: BeatEvent): Pulse {
  return { id: (previous?.id ?? 0) + 1, event };
}
