import React, { useState } from 'react';
import { Button } from './ui/Button';

interface PlacementEditorProps {
  onPlacementChange?: (placement: { row: number; col: number; side: 'front' | 'back' }) => void;
}

export const PlacementEditor: React.FC<PlacementEditorProps> = ({ onPlacementChange }) => {
  const [selectedSide, setSelectedSide] = useState<'front' | 'back'>('front');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    onPlacementChange?.({ row, col, side: selectedSide });
  };

  const toggleSide = () => {
    setSelectedSide(prev => prev === 'front' ? 'back' : 'front');
  };

  const renderGrid = () => {
    const rows = 6;
    const cols = 10;
    const grid = [];

    for (let row = 0; row < rows; row++) {
      const rowCells = [];
      for (let col = 0; col < cols; col++) {
        const isSelected = selectedCell?.row === row && selectedCell?.col === col;
        rowCells.push(
          <div
            key={`${row}-${col}`}
            className={`
              w-8 h-8 border border-gray-300 cursor-pointer transition-colors
              hover:bg-gray-100 flex items-center justify-center text-xs
              ${isSelected ? 'bg-blue-500 text-white' : 'bg-white'}
            `}
            onClick={() => handleCellClick(row, col)}
            title={`Row ${row + 1}, Column ${col + 1}`}
          >
            {isSelected ? '●' : ''}
          </div>
        );
      }
      grid.push(
        <div key={row} className="flex gap-1">
          {rowCells}
        </div>
      );
    }

    return grid;
  };

  return (
    <div className="p-4 bg-white rounded-lg border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Fridge Placement Editor</h3>
        
        {/* Front/Back Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium">Side:</span>
          <Button
            variant={selectedSide === 'front' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedSide('front')}
          >
            Front
          </Button>
          <Button
            variant={selectedSide === 'back' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedSide('back')}
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
        {selectedCell && (
          <div className="mt-3 text-sm text-gray-600">
            Selected: Row {selectedCell.row + 1}, Column {selectedCell.col + 1} ({selectedSide})
          </div>
        )}
      </div>
    </div>
  );
};
