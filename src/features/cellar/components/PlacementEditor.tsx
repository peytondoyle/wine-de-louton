import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { supabase } from '../../../lib/supabase';

interface PlacementEditorProps {
  wineId?: string;
  onPlacementChange?: (placement: { shelf: number; column: number; depth: 'front' | 'back' }) => void;
}

interface CellarSlot {
  id: string;
  wine_id: string | null;
  shelf: number;
  column_position: number;
  depth: 'front' | 'back';
}

export const PlacementEditor: React.FC<PlacementEditorProps> = ({ wineId, onPlacementChange }) => {
  const [selectedDepth, setSelectedDepth] = useState<'front' | 'back'>('front');
  const [selectedSlot, setSelectedSlot] = useState<{ shelf: number; column: number } | null>(null);
  const [occupiedSlots, setOccupiedSlots] = useState<CellarSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Load occupied slots
  useEffect(() => {
    const loadOccupiedSlots = async () => {
      try {
        const { data, error } = await supabase
          .from('cellar_slots')
          .select('*')
          .eq('fridge_id', '00000000-0000-0000-0000-000000000001'); // Default fridge ID
        
        if (error) throw error;
        setOccupiedSlots(data || []);
      } catch (error) {
        console.error('Error loading occupied slots:', error);
      }
    };

    loadOccupiedSlots();
  }, []);

  const handleSlotClick = async (shelf: number, column: number) => {
    setSelectedSlot({ shelf, column });
    
    // Check for collision
    const isOccupied = occupiedSlots.some(slot => 
      slot.shelf === shelf && 
      slot.column_position === column && 
      slot.depth === selectedDepth &&
      slot.wine_id !== wineId
    );

    if (isOccupied) {
      alert('This slot is already occupied');
      return;
    }

    onPlacementChange?.({ shelf, column, depth: selectedDepth });
  };

  const isSlotOccupied = (shelf: number, column: number, depth: 'front' | 'back') => {
    return occupiedSlots.some(slot => 
      slot.shelf === shelf && 
      slot.column_position === column && 
      slot.depth === depth
    );
  };

  const renderGrid = () => {
    const shelves = 6;
    const columns = 5;
    const grid = [];

    for (let shelf = 1; shelf <= shelves; shelf++) {
      const rowCells = [];
      for (let column = 1; column <= columns; column++) {
        const isSelected = selectedSlot?.shelf === shelf && selectedSlot?.column === column;
        const isOccupied = isSlotOccupied(shelf, column, selectedDepth);
        
        rowCells.push(
          <div
            key={`${shelf}-${column}`}
            className={`
              w-12 h-12 border border-gray-300 cursor-pointer transition-colors
              hover:bg-gray-100 flex items-center justify-center text-xs
              ${isSelected ? 'bg-blue-500 text-white' : isOccupied ? 'bg-red-100 text-red-600' : 'bg-white'}
            `}
            onClick={() => handleSlotClick(shelf, column)}
            title={`Shelf ${shelf}, Column ${column} (${selectedDepth})`}
          >
            {isSelected ? '●' : isOccupied ? '×' : ''}
          </div>
        );
      }
      grid.push(
        <div key={shelf} className="flex gap-1">
          {rowCells}
        </div>
      );
    }

    return grid;
  };

  const formatPlacement = (shelf: number, column: number, depth: 'front' | 'back') => {
    return `S${shelf} · C${column} · ${depth === 'front' ? 'Front' : 'Back'}`;
  };

  return (
    <div className="p-4 bg-white rounded-lg border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Cellar Placement Editor</h3>
        
        {/* Front/Back Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium">Depth:</span>
          <Button
            variant={selectedDepth === 'front' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedDepth('front')}
          >
            Front
          </Button>
          <Button
            variant={selectedDepth === 'back' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedDepth('back')}
          >
            Back
          </Button>
        </div>

        {/* Grid */}
        <div className="border border-gray-300 p-2 rounded bg-gray-50">
          <div className="space-y-1">
            {renderGrid()}
          </div>
        </div>

        {/* Selection Info */}
        {selectedSlot && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">Selected:</span>
            <Badge variant="outline">
              {formatPlacement(selectedSlot.shelf, selectedSlot.column, selectedDepth)}
            </Badge>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-white border border-gray-300"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-gray-300"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 border border-gray-300"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
