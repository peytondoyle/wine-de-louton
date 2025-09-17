// Stable types for cellar map view - no complex domain dependencies
export type SlotId = `${number}-${number}-${"F"|"B"}`; // row-col-depth

export interface CellarMapSlot {
  id: SlotId;
  row: number;
  col: number;
  depth: "F" | "B";
  occupied: boolean;
  wineId?: string;
  label?: string; // e.g., "2018 Turley"
}

export interface CellarMapConfig { 
  rows: number; 
  cols: number; 
}

// Raw slot data that the adapter consumes
export interface RawSlot {
  row: number;
  col: number;
  depth: "F" | "B";
  wineId?: string;
  label?: string;
}
