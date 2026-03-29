/** True when the client should attempt to load a remote avatar. */
export function hasAvatarUrl(url?: string | null): boolean {
  return typeof url === 'string' && url.trim().length > 0;
}

/**
 * Storage emulator URLs look like `http://127.0.0.1:9199/v0/b/...`.
 * On a physical device, 127.0.0.1 is the phone itself, so `<Image>` fails and
 * UserAvatar falls back to the default icon — even though Firestore has a valid `avatarUrl`.
 *
 * Preferred fix: set `FIREBASE_STORAGE_EMULATOR_DOWNLOAD_HOST` on the API server to your
 * machine's LAN IP (see cloth-in-server `.env.example`).
 *
 * Fallback: set `EXPO_PUBLIC_STORAGE_EMULATOR_PUBLIC_HOST` (e.g. `192.168.1.42:9199`) so this
 * function rewrites localhost/127.0.0.1 to that host when rendering.
 */
export function resolveAvatarDisplayUrl(url?: string | null): string | undefined {
  if (!hasAvatarUrl(url)) return undefined;
  const trimmed = url!.trim();
  const override = process.env.EXPO_PUBLIC_STORAGE_EMULATOR_PUBLIC_HOST?.trim();
  if (!override) return trimmed;

  try {
    const u = new URL(trimmed);
    if (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost') {
      return trimmed;
    }
    const colon = override.indexOf(':');
    const host = colon >= 0 ? override.slice(0, colon) : override;
    const portPart = colon >= 0 ? override.slice(colon + 1) : '';
    if (!host) return trimmed;
    u.hostname = host;
    if (portPart) u.port = portPart;
    else if (!u.port || u.port === '') u.port = '9199';
    return u.toString();
  } catch {
    return trimmed;
  }
}
