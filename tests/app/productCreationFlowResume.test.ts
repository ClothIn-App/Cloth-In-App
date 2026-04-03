/**
 * Integration test: FitPic → add-product → back → add-product resume cycle.
 *
 * Validates Phase 1 §4.2 (FitPic-origin restoration) and §4.1 (draft preservation):
 *   1. A draft saved mid-session can be reloaded in a new mount of add-product with
 *      the same sourceFlow + draftSessionId.
 *   2. When the create-modals stack remounts (new draftSessionId), the stale draft
 *      from the previous session is removed and the new session is registered.
 *   3. A draft saved with one sourceFlow does not pollute drafts for another sourceFlow.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProductFormData } from '@/components/create/product/addproductcontext';
import {
  activeSessionStorageKey,
  cleanupStaleSessionDraft,
  clearProductFormDraft,
  loadProductFormDraft,
  productFormDraftStorageKey,
  saveProductFormDraft,
  PRODUCT_FORM_DRAFT_VERSION,
  type ProductFormDraftSnapshot,
} from '@/src/create/product/productFormDraftStorage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => { store[key] = value; }),
      removeItem: jest.fn(async (key: string) => { delete store[key]; }),
      _store: store,
      _reset: () => { Object.keys(store).forEach(k => delete store[k]); },
    },
  };
});

const store = () => (AsyncStorage as unknown as { _store: Record<string, string> })._store;
const resetStore = () => (AsyncStorage as unknown as { _reset: () => void })._reset();

const baseForm: ProductFormData = {
  category: 'tops',
  brand: 'Nike',
  productName: 'Air Tee',
  color: 'black',
  specifications: '',
  description: '',
  link: 'https://example.com/p',
  photos: ['file:///a.jpg'],
  priceType: 'fixed',
  price: '30',
  originalPrice: '',
};

function makeSnapshot(overrides?: Partial<ProductFormData>): ProductFormDraftSnapshot {
  return {
    version: PRODUCT_FORM_DRAFT_VERSION,
    form: { ...baseForm, ...overrides },
    selectedBrandId: 'brand-id-1',
    isBrandConfirmed: true,
    isProductConfirmed: true,
    isColorConfirmed: true,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ---------------------------------------------------------------------------
// §4.1 — Draft preservation: save then reload with same session id
// ---------------------------------------------------------------------------
describe('draft save → reload (same session)', () => {
  test('reloaded snapshot matches what was saved', async () => {
    const snap = makeSnapshot();
    await saveProductFormDraft('fitpic', 'session-A', snap);
    const loaded = await loadProductFormDraft('fitpic', 'session-A');
    expect(loaded).toEqual(snap);
  });

  test('draft is not available under a different session id', async () => {
    const snap = makeSnapshot();
    await saveProductFormDraft('fitpic', 'session-A', snap);
    const loaded = await loadProductFormDraft('fitpic', 'session-B');
    expect(loaded).toBeNull();
  });

  test('partial form fields (mid-fill) are preserved across reload', async () => {
    const snap = makeSnapshot({ productName: '', color: '', photos: [] });
    await saveProductFormDraft('fitpic', 'session-A', snap);
    const loaded = await loadProductFormDraft('fitpic', 'session-A');
    expect(loaded?.form.productName).toBe('');
    expect(loaded?.form.brand).toBe('Nike');
  });
});

// ---------------------------------------------------------------------------
// §4.2 — FitPic-origin restoration: stale draft cleanup on new session mount
// ---------------------------------------------------------------------------
describe('cleanupStaleSessionDraft (stack remount scenario)', () => {
  test('registers first session and leaves its draft intact', async () => {
    const snap = makeSnapshot();
    await saveProductFormDraft('fitpic', 'session-1', snap);
    await cleanupStaleSessionDraft('fitpic', 'session-1');

    expect(await AsyncStorage.getItem(activeSessionStorageKey('fitpic'))).toBe('session-1');
    expect(await loadProductFormDraft('fitpic', 'session-1')).toEqual(snap);
  });

  test('removes orphaned draft when a new session id is registered', async () => {
    const snap = makeSnapshot();
    await saveProductFormDraft('fitpic', 'session-1', snap);
    await cleanupStaleSessionDraft('fitpic', 'session-1');

    // Stack remounts → new session id
    await cleanupStaleSessionDraft('fitpic', 'session-2');

    expect(await AsyncStorage.getItem(activeSessionStorageKey('fitpic'))).toBe('session-2');
    expect(await loadProductFormDraft('fitpic', 'session-1')).toBeNull();
  });

  test('does not touch a draft that was already cleared before new session', async () => {
    await saveProductFormDraft('fitpic', 'session-1', makeSnapshot());
    await cleanupStaleSessionDraft('fitpic', 'session-1');
    await clearProductFormDraft('fitpic', 'session-1');

    await cleanupStaleSessionDraft('fitpic', 'session-2');

    // removeItem should have been called for session-1 draft key at some point,
    // but session-2 draft should not exist yet.
    expect(await loadProductFormDraft('fitpic', 'session-2')).toBeNull();
    expect(await AsyncStorage.getItem(activeSessionStorageKey('fitpic'))).toBe('session-2');
  });

  test('standalone and fitpic sessions are tracked independently', async () => {
    const snapFitpic = makeSnapshot({ brand: 'FitPicBrand' });
    const snapStandalone = makeSnapshot({ brand: 'StandaloneBrand' });

    await saveProductFormDraft('fitpic', 'fp-s1', snapFitpic);
    await saveProductFormDraft('standalone', 'sa-s1', snapStandalone);
    await cleanupStaleSessionDraft('fitpic', 'fp-s1');
    await cleanupStaleSessionDraft('standalone', 'sa-s1');

    // Rotate only fitpic session
    await cleanupStaleSessionDraft('fitpic', 'fp-s2');

    // fitpic old draft is gone; standalone draft is untouched
    expect(await loadProductFormDraft('fitpic', 'fp-s1')).toBeNull();
    expect(await loadProductFormDraft('standalone', 'sa-s1')).toEqual(snapStandalone);
  });
});

// ---------------------------------------------------------------------------
// §4.1 — Draft cleared on success / discard (no lingering data)
// ---------------------------------------------------------------------------
describe('draft cleared after resolution', () => {
  test('draft is gone after clearProductFormDraft (simulates success or discard)', async () => {
    const snap = makeSnapshot();
    await saveProductFormDraft('fitpic', 'session-A', snap);
    await clearProductFormDraft('fitpic', 'session-A');
    expect(await loadProductFormDraft('fitpic', 'session-A')).toBeNull();
  });

  test('clearing one flow does not affect the other', async () => {
    await saveProductFormDraft('fitpic', 's', makeSnapshot({ brand: 'A' }));
    await saveProductFormDraft('standalone', 's', makeSnapshot({ brand: 'B' }));
    await clearProductFormDraft('fitpic', 's');
    const loaded = await loadProductFormDraft('standalone', 's');
    expect(loaded?.form.brand).toBe('B');
  });
});

// ---------------------------------------------------------------------------
// Storage key format (regression guard for §3.2 serialization contract)
// ---------------------------------------------------------------------------
describe('storage key contract', () => {
  test('draft key is namespaced and stable', () => {
    expect(productFormDraftStorageKey('fitpic', 'abc')).toBe(
      '@clothin:product_form_draft:fitpic:abc'
    );
    expect(productFormDraftStorageKey('standalone', 'xyz')).toBe(
      '@clothin:product_form_draft:standalone:xyz'
    );
  });

  test('active session key is namespaced and stable', () => {
    expect(activeSessionStorageKey('fitpic')).toBe(
      '@clothin:product_form_draft:session:fitpic'
    );
    expect(activeSessionStorageKey('standalone')).toBe(
      '@clothin:product_form_draft:session:standalone'
    );
  });
});
