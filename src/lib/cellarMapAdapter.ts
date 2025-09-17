import { type CellarMapSlot, type CellarMapConfig, type SlotId, type RawSlot } from "../types/cellarMap";

/**
 * Pure adapter function that converts raw slot data into stable cellar map slots
 * No domain dependencies - just data transformation
 */
export function toCellarMapSlots(
  rawSlots: RawSlot[],
  cfg: CellarMapConfig
): CellarMapSlot[] {
  const slots: CellarMapSlot[] = [];
  
  for (let r = 1; r <= cfg.rows; r++) {
    for (let c = 1; c <= cfg.cols; c++) {
      (["F", "B"] as const).forEach(d => {
        const found = rawSlots.find(s => s.row === r && s.col === c && s.depth === d);
        const id: SlotId = `${r}-${c}-${d}`;
        slots.push({
          id,
          row: r,
          col: c,
          depth: d,
          occupied: !!found?.wineId,
          wineId: found?.wineId,
          label: found?.label
        } satisfies CellarMapSlot);
      });
    }
  }
  
  return slots;
}

/**
 * Helper to get occupancy stats
 */
export function getOccupancyStats(slots: CellarMapSlot[]) {
  const occupied = slots.filter(s => s.occupied);
  const front = occupied.filter(s => s.depth === "F");
  const back = occupied.filter(s => s.depth === "B");
  
  return {
    total: slots.length,
    occupied: occupied.length,
    front: front.length,
    back: back.length,
    percentage: Math.round((occupied.length / slots.length) * 100)
  };
}
