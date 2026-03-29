/** True when the client should attempt to load a remote avatar. */
export function hasAvatarUrl(url?: string | null): boolean {
  return typeof url === 'string' && url.trim().length > 0;
}
