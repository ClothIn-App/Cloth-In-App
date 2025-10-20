// src/context/CreateSheetContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";

type Ctx = { open: () => void; close: () => void; visible: boolean };
const CreateSheetCtx = createContext<Ctx | null>(null);

export function CreateSheetProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return (
    <CreateSheetCtx.Provider value={{ open, close, visible }}>
      {children}
      {/* CreateActionBubbles removed - will be reimplemented later */}
    </CreateSheetCtx.Provider>
  );
}

export function useCreateSheet() {
  const ctx = useContext(CreateSheetCtx);
  if (!ctx) throw new Error("useCreateSheet must be used inside CreateSheetProvider");
  return ctx;
}