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

// AI Enrichment interface
export interface AiEnrichment {
  tasting_notes?: string;
  drink_window?: {
    from_year: number;
    to_year: number;
    drink_now: boolean;
  };
  possible_scores?: {
    wine_spectator?: {
      score: number;
      source_url?: string;
    };
    james_suckling?: {
      score: number;
      source_url?: string;
    };
  };
  sources?: string[];
  confidence: number;
}

// Main Wine interface mirroring the database schema
export interface Wine {
  id: string;
  created_at: string;
  updated_at: string;
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
  ai_enrichment: AiEnrichment | null;
  ai_confidence?: number | null;
  ai_last_error?: string | null;
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
