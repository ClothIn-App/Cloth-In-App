// src/create/product/mockdrafts.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

type MockDraftsContextType = {
  items: any[];
  selectedIds: string[];
  addSelected: (items: { id: string }[]) => void;
  removeSelected: (id: string) => void;
  setSelectedOrder: (ids: string[]) => void;
};

const MockDraftsContext = createContext<MockDraftsContextType | null>(null);

export function MockDraftsProvider({ children }: { children: React.ReactNode }) {
  const [items] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const addSelected = useCallback((newItems: { id: string }[]) => {
    setSelectedIds(prev => [...prev, ...newItems.map(item => item.id)]);
  }, []);

  const removeSelected = useCallback((id: string) => {
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
  }, []);

  const setSelectedOrder = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const value: MockDraftsContextType = {
    items,
    selectedIds,
    addSelected,
    removeSelected,
    setSelectedOrder,
  };

  return (
    <MockDraftsContext.Provider value={value}>
      {children}
    </MockDraftsContext.Provider>
  );
}

export function useDrafts() {
  const context = useContext(MockDraftsContext);
  if (!context) {
    throw new Error('useDrafts must be used within MockDraftsProvider');
  }
  return context;
}
