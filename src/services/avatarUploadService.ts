/**
 * Avatar Upload Service
 * Uploads a single processed image URI to POST /v1/users/avatar.
 * Returns { url, path, contentType } on success, throws on failure.
 *
 * Mock mode: returns a deterministic fake HTTPS url without calling the server.
 */

import { log } from '../debug/log';

export type AvatarUploadResult = {
  url: string;
  path: string;
  contentType: string;
};

const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8080';
const UPLOAD_TIMEOUT_MS = 30_000;

function useRealApi(): boolean {
  const mode = process.env.EXPO_PUBLIC_API_MODE as string | undefined;
  if (mode === 'real') return true;
  if (mode === 'mock') return false;
  return process.env.EXPO_PUBLIC_USE_MOCKS !== 'true';
}

/**
 * Upload a pre-processed avatar image (URI from expo-image-manipulator output)
 * to POST /v1/users/avatar.
 *
 * @param uri - Local file URI to upload (must be JPEG after manipulator pass).
 * @returns { url, path, contentType } from the server.
 * @throws Error with server message or generic fallback on failure.
 */
export async function uploadAvatarPhoto(uri: string): Promise<AvatarUploadResult> {
  if (!useRealApi()) {
    log.info('[AVATAR_UPLOAD] mock mode — returning fake url');
    return {
      url: `https://picsum.photos/seed/avatar-mock/200/200`,
      path: `avatars/mock-user/mock-avatar.jpg`,
      contentType: 'image/jpeg',
    };
  }

  const token = await (async () => {
    try {
      const { getValidIdToken } = await import('@/src/services/authTokenManager');
      return await getValidIdToken();
    } catch {
      return null;
    }
  })();

  if (!token) {
    throw new Error('Not authenticated. Please sign in and try again.');
  }

  const filename = `avatar_${Date.now()}.jpg`;
  const formData = new FormData();
  formData.append('photo', {
    uri,
    name: filename,
    type: 'image/jpeg',
  } as unknown as Blob);

  const uploadUrl = `${BASE_API_URL}/v1/users/avatar`;
  log.info('[AVATAR_UPLOAD] sending POST', { url: uploadUrl });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Do not set Content-Type — let FormData set it with boundary
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Upload timed out. Check your connection and try again.');
    }
    throw new Error('Upload failed. Check your connection and try again.');
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    let detail = `Upload failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore parse errors
    }
    log.warn('[AVATAR_UPLOAD] server error', { status: res.status, detail });
    throw new Error(detail);
  }

  const data = (await res.json()) as { url?: string; path?: string; contentType?: string };
  const url = data.url;
  const path = data.path;
  const contentType = data.contentType;

  if (!url || !path || !contentType) {
    log.warn('[AVATAR_UPLOAD] unexpected response shape', data);
    throw new Error('Upload succeeded but server returned unexpected response.');
  }

  log.info('[AVATAR_UPLOAD] success', { url });
  return { url, path, contentType };
}
