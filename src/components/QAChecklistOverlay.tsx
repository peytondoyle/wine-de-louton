import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'ui' | 'functionality' | 'integration' | 'performance';
  completed: boolean;
}

const QA_CHECKLIST_ITEMS: ChecklistItem[] = [
  // UI Features
  {
    id: 'scroll-lock',
    title: 'Scroll Lock',
    description: 'Verify scroll is locked when drawer is open and unlocked when closed',
    category: 'ui',
    completed: false,
  },
  {
    id: 'enrichment-panel',
    title: 'Enrichment Review Panel',
    description: 'Test the enrichment review panel shows AI suggestions and allows editing',
    category: 'ui',
    completed: false,
  },
  {
    id: 'confidence-badge',
    title: 'Confidence Badge',
    description: 'Check confidence badges display correctly with different confidence levels',
    category: 'ui',
    completed: false,
  },
  {
    id: 'toast-notifications',
    title: 'Toast Notifications',
    description: 'Verify toast notifications appear for various actions (save, error, success)',
    category: 'ui',
    completed: false,
  },
  {
    id: 'drawer-footer-actions',
    title: 'Drawer Footer Actions',
    description: 'Test drawer footer action buttons work correctly (save, cancel, etc.)',
    category: 'ui',
    completed: false,
  },

  // Functionality
  {
    id: 'wine-enrichment',
    title: 'Wine Enrichment',
    description: 'Test AI wine enrichment functionality with various wine types',
    category: 'functionality',
    completed: false,
  },
  {
    id: 'csv-import',
    title: 'CSV Import',
    description: 'Verify CSV import works with different file formats and handles errors',
    category: 'functionality',
    completed: false,
  },
  {
    id: 'wine-crud',
    title: 'Wine CRUD Operations',
    description: 'Test create, read, update, delete operations for wines',
    category: 'functionality',
    completed: false,
  },
  {
    id: 'keyboard-navigation',
    title: 'Keyboard Navigation',
    description: 'Test keyboard focus management and navigation throughout the app',
    category: 'functionality',
    completed: false,
  },

  // Integration
  {
    id: 'supabase-integration',
    title: 'Supabase Integration',
    description: 'Verify all Supabase operations work correctly (auth, database, functions)',
    category: 'integration',
    completed: false,
  },
  {
    id: 'ai-function-calls',
    title: 'AI Function Calls',
    description: 'Test AI enrichment function calls and error handling',
    category: 'integration',
    completed: false,
  },

  // Performance
  {
    id: 'loading-states',
    title: 'Loading States',
    description: 'Verify loading states are shown during async operations',
    category: 'performance',
    completed: false,
  },
  {
    id: 'error-handling',
    title: 'Error Handling',
    description: 'Test error handling for network failures, validation errors, etc.',
    category: 'performance',
    completed: false,
  },
];

const CATEGORY_COLORS = {
  ui: 'bg-blue-100 text-blue-800',
  functionality: 'bg-green-100 text-green-800',
  integration: 'bg-purple-100 text-purple-800',
  performance: 'bg-orange-100 text-orange-800',
};

export const QAChecklistOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(QA_CHECKLIST_ITEMS);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // Check if we're in development mode
    setIsDevMode(import.meta.env.DEV);
  }, []);

  const toggleItem = (id: string) => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const resetChecklist = () => {
    setChecklistItems(prev =>
      prev.map(item => ({ ...item, completed: false }))
    );
  };

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  if (!isDevMode) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
          title="QA Checklist"
        >
          QA
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">QA Checklist</h2>
                  <p className="text-gray-600">Manual testing checklist for new features</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-600">
                    {completedCount} / {totalCount} completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(
                  checklistItems.reduce((acc, item) => {
                    if (!acc[item.category]) {
                      acc[item.category] = [];
                    }
                    acc[item.category].push(item);
                    return acc;
                  }, {} as Record<string, ChecklistItem[]>)
                ).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-lg font-semibold capitalize">{category}</h3>
                    {items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleItem(item.id)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{item.title}</h4>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${CATEGORY_COLORS[item.category]}`}
                            >
                              {item.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={resetChecklist}
                  className="text-gray-600"
                >
                  Reset All
                </Button>
                <div className="text-sm text-gray-500">
                  {progressPercentage === 100 ? '🎉 All tests completed!' : ''}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
