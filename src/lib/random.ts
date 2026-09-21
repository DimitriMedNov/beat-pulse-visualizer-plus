// Aleatoriedad reproducible. La misma semilla devuelve siempre lo mismo, que es
// lo que permite probar tanto los generadores de latidos como los casos del
// examen sin quedar a merced del azar real.

/** Mezcla una semilla entera y la reparte en el intervalo [0, 1). */
export function hash01(n: number): number {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Entero dentro del intervalo cerrado [min, max]. */
export function integerBetween(seed: number, min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.floor(hash01(seed) * (max - min + 1));
}

/** Un elemento de la lista, elegido por la semilla. */
export function pickFrom<T>(items: readonly T[], seed: number): T {
  return items[integerBetween(seed, 0, items.length - 1)];
}
