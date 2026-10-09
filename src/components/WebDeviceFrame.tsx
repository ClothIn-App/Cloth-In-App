// src/components/WebDeviceFrame.tsx
// Native: render the app as-is. The web build uses WebDeviceFrame.web.tsx.
import type { ReactNode } from 'react';

export default function WebDeviceFrame({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
