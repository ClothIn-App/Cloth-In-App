import { useCallback, useEffect, useRef, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';

/** Minimal shape used by the UI layer (grid/preview). */
export type AssetLite = {
  id: string;
  uri: string;
  width: number;
  height: number;
  creationTime: number;
};

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

type Page = Awaited<ReturnType<typeof MediaLibrary.getAssetsAsync>>;

const PAGE_SIZE = 48;            // good balance for grids
export const SKELETON_COUNT = 16; // suggested placeholders while loading

function toLite(a: MediaLibrary.Asset): AssetLite {
  return {
    id: a.id,
    uri: a.uri,
    width: a.width ?? 0,
    height: a.height ?? 0,
    creationTime: (a as any).creationTime ?? (a as any).modificationTime ?? Date.now(),
  };
}

/**
 * Photos-only camera roll with permissions + paging.
 * Used by: CameraRollScreen, PhotoGrid
 */
export function useCameraRoll() {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>('undetermined');

  const [assets, setAssets] = useState<AssetLite[]>([]);
  const [loading, setLoading] = useState(false);       // loading next page
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh
  const [hasNextPage, setHasNextPage] = useState(true);

  // Keep pagination cursor internally
  const endCursorRef = useRef<string | null>(null);

  const fetchPage = useCallback(
    async (opts: { after?: string | null; replace?: boolean } = {}) => {
      const { after = null, replace = false } = opts;

      const page: Page = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: after ?? undefined,
        mediaType: [MediaLibrary.MediaType.photo], // photos only
        // (Omit sortBy to avoid SDK typing churn; default is newest-first on both platforms)
      });

      const lite = page.assets.map(toLite);

      setAssets(prev => (replace ? lite : [...prev, ...lite]));
      setHasNextPage(Boolean(page.hasNextPage));
      endCursorRef.current = page.endCursor ?? null;
    },
    []
  );

  const initialLoad = useCallback(async () => {
    setLoading(true);
    try {
      endCursorRef.current = null;
      await fetchPage({ replace: true });
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadNextPage = useCallback(async () => {
    if (loading || refreshing || !hasNextPage) return;
    setLoading(true);
    try {
      await fetchPage({ after: endCursorRef.current, replace: false });
    } finally {
      setLoading(false);
    }
  }, [fetchPage, hasNextPage, loading, refreshing]);

  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await initialLoad();
    } finally {
      setRefreshing(false);
    }
  }, [initialLoad, refreshing]);

  const requestPermission = useCallback(async () => {
    const res = await MediaLibrary.requestPermissionsAsync();
    const status = (res.status as PermissionStatus) ?? 'undetermined';
    setPermissionStatus(status);
    if (status === 'granted') {
      await initialLoad();
    }
  }, [initialLoad]);

  // On mount: check permission; if granted, load first page.
  useEffect(() => {
    (async () => {
      const res = await MediaLibrary.getPermissionsAsync();
      const status = (res.status as PermissionStatus) ?? 'undetermined';
      setPermissionStatus(status);
      if (status === 'granted') {
        await initialLoad();
      }
    })();
  }, [initialLoad]);

  return {
    // state
    permissionStatus,       // 'undetermined' | 'granted' | 'denied'
    assets,                 // AssetLite[]
    loading,                // next-page spinner
    refreshing,             // pull-to-refresh spinner
    hasNextPage,            // for infinite scroll
    skeletonCount: SKELETON_COUNT,

    // actions
    loadNextPage,           // () => Promise<void>
    refresh,                // () => Promise<void>
    requestPermission,      // () => Promise<void>
  };
}

/* Import example:
   import { useCameraRoll } from './useCameraRoll';
*/
