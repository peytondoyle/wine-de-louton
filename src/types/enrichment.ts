// Enrichment types with discriminated unions for type safety

export type FieldKey =
  | "producer" 
  | "wineName" 
  | "vintage" 
  | "region" 
  | "varietal" 
  | "sizeMl" 
  | "notes"
  | "drink_window_from"
  | "drink_window_to"
  | "tasting_notes"
  | "score_wine_spectator"
  | "score_james_suckling"
  | "food_pairings";

export type AISource = "openai" | "heuristic";

export type AIFieldSuggestion =
  | { 
      kind: "present"; 
      key: FieldKey; 
      current: string | number | null; 
      suggestion: string | number; 
      confidence: number; 
      source: AISource;
    }
  | { 
      kind: "missing"; 
      key: FieldKey; 
      current: null; 
      suggestion: string | number; 
      confidence: number; 
      source: AISource;
    }
  | { 
      kind: "skip"; 
      key: FieldKey; 
      reason: string;
    };

export interface AIEnrichment {
  wineId: string;
  fields: AIFieldSuggestion[];
}

// Helper type for field suggestions that can be applied
export type ApplicableSuggestion = Extract<AIFieldSuggestion, { kind: "present" | "missing" }>;

// Helper type for field keys that can be applied
export type ApplicableFieldKey = ApplicableSuggestion["key"];

// Enhanced types for AI suggestions panel with provenance tracking
export interface FieldProvenance {
  lastAppliedFromAI: boolean;
  appliedAt: string; // ISO timestamp
  appliedField?: FieldKey;
  appliedConfidence?: number;
}

export interface AISuggestionsState {
  isOpen: boolean;
  suggestions: AIFieldSuggestion[];
  appliedFields: Set<FieldKey>;
  skippedFields: Set<FieldKey>;
  isLoading: boolean;
  error: string | null;
}

export interface FieldComparison {
  key: FieldKey;
  currentValue: string | number | null;
  suggestedValue: string | number;
  confidence: number;
  source: AISource;
  isApplied: boolean;
  isSkipped: boolean;
  canApply: boolean;
}

export interface AISuggestionsPanelProps {
  wine: {
    id: string;
    producer: string;
    wine_name?: string;
    vintage?: number;
    region?: string;
    varietals?: string[];
    bottle_size?: string;
    peyton_notes?: string;
    drink_window_from?: number;
    drink_window_to?: number;
    score_wine_spectator?: number;
    score_james_suckling?: number;
    ai_enrichment?: any;
    ai_confidence?: number;
  };
  suggestions: AIFieldSuggestion[];
  onApply: (fieldKey: FieldKey, suggestion: AIFieldSuggestion) => Promise<void>;
  onSkip: (fieldKey: FieldKey) => void;
  onApplyAllSafe: () => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
}

// Confidence levels for UI display
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high': return 'text-green-700 bg-green-100';
    case 'medium': return 'text-yellow-700 bg-yellow-100';
    case 'low': return 'text-red-700 bg-red-100';
  }
}
