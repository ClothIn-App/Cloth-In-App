import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProductFormData } from '@/components/create/product/addproductcontext';
import type { ProductCreationSourceFlow } from './productCreationFlowTypes';

const PREFIX = '@clothin:product_form_draft:';
const SESSION_PREFIX = '@clothin:product_form_draft:session:';

export const PRODUCT_FORM_DRAFT_VERSION = 1 as const;

export type ProductFormDraftSnapshot = {
  version: typeof PRODUCT_FORM_DRAFT_VERSION;
  form: ProductFormData;
  selectedBrandId: string | null;
  isBrandConfirmed: boolean;
  isProductConfirmed: boolean;
  isColorConfirmed: boolean;
};

export function productFormDraftStorageKey(
  sourceFlow: ProductCreationSourceFlow,
  draftSessionId: string
): string {
  return `${PREFIX}${sourceFlow}:${draftSessionId}`;
}

function isProductFormData(x: unknown): x is ProductFormData {
  if (x == null || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.category === 'string' &&
    typeof o.brand === 'string' &&
    typeof o.productName === 'string' &&
    typeof o.color === 'string' &&
    Array.isArray(o.photos)
  );
}

function parseSnapshot(raw: string): ProductFormDraftSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null || typeof parsed !== 'object') return null;
    const o = parsed as Record<string, unknown>;
    if (o.version !== PRODUCT_FORM_DRAFT_VERSION) return null;
    if (!isProductFormData(o.form)) return null;
    return {
      version: PRODUCT_FORM_DRAFT_VERSION,
      form: o.form,
      selectedBrandId: typeof o.selectedBrandId === 'string' ? o.selectedBrandId : null,
      isBrandConfirmed: Boolean(o.isBrandConfirmed),
      isProductConfirmed: Boolean(o.isProductConfirmed),
      isColorConfirmed: Boolean(o.isColorConfirmed),
    };
  } catch {
    return null;
  }
}

export async function loadProductFormDraft(
  sourceFlow: ProductCreationSourceFlow,
  draftSessionId: string
): Promise<ProductFormDraftSnapshot | null> {
  try {
    const key = productFormDraftStorageKey(sourceFlow, draftSessionId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return parseSnapshot(raw);
  } catch (e) {
    console.error('loadProductFormDraft:', e);
    return null;
  }
}

export async function saveProductFormDraft(
  sourceFlow: ProductCreationSourceFlow,
  draftSessionId: string,
  snapshot: ProductFormDraftSnapshot
): Promise<void> {
  try {
    const key = productFormDraftStorageKey(sourceFlow, draftSessionId);
    await AsyncStorage.setItem(key, JSON.stringify(snapshot));
  } catch (e) {
    console.error('saveProductFormDraft:', e);
  }
}

export async function clearProductFormDraft(
  sourceFlow: ProductCreationSourceFlow,
  draftSessionId: string
): Promise<void> {
  try {
    const key = productFormDraftStorageKey(sourceFlow, draftSessionId);
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('clearProductFormDraft:', e);
  }
}

/**
 * Key that tracks the most-recently-registered session id for a given source flow.
 * Used by cleanupStaleSessionDraft to find and remove orphaned draft entries.
 */
export function activeSessionStorageKey(sourceFlow: ProductCreationSourceFlow): string {
  return `${SESSION_PREFIX}${sourceFlow}`;
}

/**
 * Call once when add-product mounts with a new session.
 *
 * - Reads the previously stored session id for `sourceFlow`.
 * - If it differs from `currentSessionId`, deletes the stale draft so AsyncStorage
 *   does not accumulate orphaned keys across create-modal stack remounts.
 * - Writes `currentSessionId` as the new active session for this flow.
 */
export async function cleanupStaleSessionDraft(
  sourceFlow: ProductCreationSourceFlow,
  currentSessionId: string
): Promise<void> {
  try {
    const sessionKey = activeSessionStorageKey(sourceFlow);
    const prevSessionId = await AsyncStorage.getItem(sessionKey);
    if (prevSessionId && prevSessionId !== currentSessionId) {
      await clearProductFormDraft(sourceFlow, prevSessionId);
    }
    await AsyncStorage.setItem(sessionKey, currentSessionId);
  } catch (e) {
    console.error('cleanupStaleSessionDraft:', e);
  }
}
