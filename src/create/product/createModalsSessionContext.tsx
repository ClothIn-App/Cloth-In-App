import React, { createContext, useContext, useMemo, useState } from 'react';

function generateDraftSessionId(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `ds_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

type CreateModalsSessionValue = {
  draftSessionId: string;
};

const CreateModalsSessionContext = createContext<CreateModalsSessionValue | null>(null);

export function CreateModalsSessionProvider({ children }: { children: React.ReactNode }) {
  const [draftSessionId] = useState(generateDraftSessionId);
  const value = useMemo(() => ({ draftSessionId }), [draftSessionId]);
  return (
    <CreateModalsSessionContext.Provider value={value}>{children}</CreateModalsSessionContext.Provider>
  );
}

export function useCreateModalsSession(): CreateModalsSessionValue {
  const ctx = useContext(CreateModalsSessionContext);
  if (!ctx) {
    throw new Error('useCreateModalsSession must be used within CreateModalsSessionProvider');
  }
  return ctx;
}
