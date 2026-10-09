// src/components/WebDeviceFrame.web.tsx
// The app's layouts are sized from the window width, so on a wide desktop
// browser they stretch edge to edge. When the page is opened directly on a wide
// screen, show a short intro next to a phone-sized <iframe> of the same URL.
// Inside the iframe the window *is* phone-sized, so every screen lays out exactly
// as it does on a device. Narrow screens and embeds render the app directly.
import type { CSSProperties, ReactNode } from 'react';

const FRAME_MIN_VIEWPORT_WIDTH = 768;

function shouldShowFrame(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).has('noframe')) return false;
  let isTopWindow = true;
  try {
    isTopWindow = window.self === window.top;
  } catch {
    isTopWindow = false; // cross-origin parent: we are embedded
  }
  return isTopWindow && window.innerWidth >= FRAME_MIN_VIEWPORT_WIDTH;
}

// Decided once at load so the app never mounts in the outer page.
const SHOW_FRAME = shouldShowFrame();

export default function WebDeviceFrame({ children }: { children: ReactNode }) {
  if (!SHOW_FRAME) return <>{children}</>;

  const src = window.location.pathname + window.location.search;

  return (
    <div style={styles.page}>
      <div style={styles.intro}>
        <h1 style={styles.title}>Clōth-In</h1>
        <p style={styles.tagline}>Discover real looks from real people.</p>
        <p style={styles.body}>
          A social app for fashion: post fitpics, tag the products you&apos;re wearing, build a
          closet, and discover outfits through a personalized For You feed, search, follows,
          comments and reactions.
        </p>
        <p style={styles.body}>
          Built with React Native (Expo), a Python API server, and Firebase. This is the iOS
          app running in your browser on sample data.
        </p>
        <div style={styles.hint}>
          <strong>Try it:</strong> tap <em>Log In</em> and use any email and password.
        </div>
      </div>
      <iframe title="Clōth-In app demo" src={src} style={styles.phone} />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    overflow: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 64,
    padding: 32,
    boxSizing: 'border-box',
    background: '#f2f2f2',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#111',
  },
  intro: { maxWidth: 380 },
  title: { fontSize: 48, fontWeight: 800, margin: '0 0 8px' },
  tagline: { fontSize: 20, margin: '0 0 24px', color: '#444' },
  body: { fontSize: 15, lineHeight: 1.6, margin: '0 0 16px', color: '#333' },
  hint: {
    marginTop: 24,
    padding: '12px 16px',
    borderRadius: 12,
    background: '#fff',
    border: '1px solid #ddd',
    fontSize: 14,
  },
  phone: {
    width: 390,
    height: 'min(844px, calc(100vh - 64px))',
    border: '12px solid #111',
    borderRadius: 48,
    background: '#fff',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
    flexShrink: 0,
  },
};
