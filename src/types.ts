// Enums matching the database schema
export enum BottleSize {
  SMALL_375ML = '375ml',
  MEDIUM_500ML = '500ml',
  STANDARD_750ML = '750ml',
  MAGNUM_1_5L = '1.5L',
  DOUBLE_MAGNUM_3L = '3L',
  OTHER = 'Other'
}

export enum WineStatus {
  CELLARED = 'Cellared',
  DRUNK = 'Drunk'
}

export enum DepthPosition {
  FRONT = 1,
  BACK = 2
}

// AI Enrichment interface - field-by-field structure
export type AIEnrichment = {
  drink_window?: { from?: number; to?: number; source?: string[] };
  tasting_notes?: { text: string; source?: string[] };
  critic_scores?: { wine_spectator?: number; james_suckling?: number; source?: string[] };
  food_pairings?: { items: string[]; source?: string[] };
};

// Main Wine interface mirroring the database schema
export interface Wine {
  id: string;
  created_at: string;
  updated_at: string;
  household_id: string;
  vintage?: number;
  producer: string;
  vineyard?: string;
  wine_name?: string;
  appellation?: string;
  region?: string;
  country_code?: string;
  us_state?: string;
  varietals: string[];
  bottle_size: BottleSize;
  purchase_date?: string;
  purchase_place?: string;
  location_row?: string;
  location_position?: number;
  status: WineStatus;
  drank_on?: string;
  peyton_rating?: number;
  louis_rating?: number;
  companions: string[];
  peyton_notes?: string;
  louis_notes?: string;
  score_wine_spectator?: number;
  score_james_suckling?: number;
  drink_window_from?: number;
  drink_window_to?: number;
  drink_now?: boolean;
  ai_enrichment?: AIEnrichment | null;
  ai_confidence?: number | null;
  ai_last_error?: string | null;
  ai_refreshed_at?: string | null;
  average_rating?: number; // Generated column
}

// Filter and sort types for the data layer
export interface WineFilters {
  status?: WineStatus;
  country_code?: string;
  region?: string;
  bottle_size?: BottleSize;
  vintageMin?: number;
  vintageMax?: number;
  search?: string;
}

export type WineSortField = 'created_at' | 'vintage' | 'average_rating';
export type WineSortDirection = 'asc' | 'desc';

export interface WineSort {
  field: WineSortField;
  direction: WineSortDirection;
}

// Form types
export type WineFormData = Partial<Omit<Wine, 'id' | 'created_at' | 'updated_at' | 'average_rating'>>;

// Cellar interfaces
export interface FridgeLayout {
  id: string;
  created_at: string;
  updated_at: string;
  household_id: string;
  fridge_id: string;
  shelves: number;
  columns: number;
  name: string;
}

export interface CellarSlot {
  id: string;
  created_at: string;
  updated_at: string;
  household_id: string;
  wine_id?: string;
  fridge_id: string;
  shelf: number;
  column_position: number;
  depth: DepthPosition;
  depth_position?: number; // Alternative field name for database compatibility
}

export interface OccupancySlot {
  shelf: number;
  column_position: number;
  depth: DepthPosition;
  wine_id?: string;
  wine_producer?: string;
  wine_name?: string;
  wine_vintage?: number;
  is_occupied: boolean;
}

export interface FridgeOccupancy {
  layout: FridgeLayout;
  slots: OccupancySlot[];
  total_slots: number;
  occupied_slots: number;
  occupancy_percentage: number;
}

// UI state types
export interface ControlsState {
  search: string;
  status: WineStatus | 'All';
  country_code: string;
  region: string;
  bottle_size: BottleSize | 'All';
  vintageMin: string;
  vintageMax: string;
  sort: WineSort;
}
