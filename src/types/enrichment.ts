// Enrichment types with discriminated unions for type safety

export type FieldKey =
  | "producer" 
  | "wineName" 
  | "vintage" 
  | "region" 
  | "varietal" 
  | "sizeMl" 
  | "notes";

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
