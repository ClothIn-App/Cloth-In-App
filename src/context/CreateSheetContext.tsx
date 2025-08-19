// src/components/create/CreateSheetContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";
import { CreateSheet } from "../components/CreateSheet"; // <- correct local path

type Ctx = { open: () => void; close: () => void; visible: boolean };
const CreateSheetCtx = createContext<Ctx | null>(null);

export function CreateSheetProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return (
    <CreateSheetCtx.Provider value={{ open, close, visible }}>
      {children}
      {/* Mount once at app level so it can appear over any tab */}
      <CreateSheet
        visible={visible}
        onClose={close}
        onSelect={(opt) => {
          // Hook up navigation/actions later if desired
          console.log("Selected:", opt);
          close();
        }}
      />
    </CreateSheetCtx.Provider>
  );
}

export function useCreateSheet() {
  const ctx = useContext(CreateSheetCtx);
  if (!ctx) throw new Error("useCreateSheet must be used inside CreateSheetProvider");
  return ctx;
}