// Undo system types for tracking wine field changes

export interface UndoChange {
  field: string;
  from: any; // Previous value
  to: any;   // New value
  timestamp: string; // ISO timestamp
  changeId: string;  // Unique identifier for this change
}

export interface UndoStack {
  changes: UndoChange[];
  maxSize: number;
}

export interface UndoResult {
  success: boolean;
  restoredField?: string;
  restoredValue?: any;
  error?: string;
}

// Field mapping for display names
export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  producer: 'Producer',
  wine_name: 'Wine Name',
  vintage: 'Vintage',
  region: 'Region',
  varietals: 'Varietals',
  bottle_size: 'Bottle Size',
  peyton_notes: 'Notes',
  drink_window_from: 'Drink Window From',
  drink_window_to: 'Drink Window To',
  score_wine_spectator: 'Wine Spectator Score',
  score_james_suckling: 'James Suckling Score',
  ai_enrichment: 'AI Enrichment'
};

// Helper function to get display name for a field
export function getFieldDisplayName(field: string): string {
  return FIELD_DISPLAY_NAMES[field] || field;
}

// Helper function to format value for display
export function formatValueForDisplay(value: any): string {
  if (value === null || value === undefined) {
    return 'Not set';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return value;
}
