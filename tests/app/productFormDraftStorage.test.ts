import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProductFormData } from '@/components/create/product/addproductcontext';
import {
  clearProductFormDraft,
  loadProductFormDraft,
  productFormDraftStorageKey,
  saveProductFormDraft,
  PRODUCT_FORM_DRAFT_VERSION,
  type ProductFormDraftSnapshot,
} from '@/src/create/product/productFormDraftStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockForm: ProductFormData = {
  category: 'tops',
  brand: 'TestBrand',
  productName: 'Test Product',
  color: 'blue',
  specifications: '',
  description: '',
  link: 'https://example.com/p',
  photos: ['file:///1.jpg'],
  priceType: 'fixed',
  price: '10',
  originalPrice: '',
};

const snapshot: ProductFormDraftSnapshot = {
  version: PRODUCT_FORM_DRAFT_VERSION,
  form: mockForm,
  selectedBrandId: 'bid1',
  isBrandConfirmed: true,
  isProductConfirmed: true,
  isColorConfirmed: true,
};

describe('productFormDraftStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('productFormDraftStorageKey is stable and namespaced', () => {
    expect(productFormDraftStorageKey('fitpic', 'abc-123')).toBe(
      '@clothin:product_form_draft:fitpic:abc-123'
    );
    expect(productFormDraftStorageKey('standalone', 'xyz')).toBe(
      '@clothin:product_form_draft:standalone:xyz'
    );
  });

  test('saveProductFormDraft serializes snapshot', async () => {
    await saveProductFormDraft('fitpic', 's1', snapshot);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      productFormDraftStorageKey('fitpic', 's1'),
      JSON.stringify(snapshot)
    );
  });

  test('loadProductFormDraft parses valid JSON', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(snapshot));
    const out = await loadProductFormDraft('fitpic', 's1');
    expect(out).toEqual(snapshot);
  });

  test('loadProductFormDraft returns null for wrong version', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ ...snapshot, version: 999 })
    );
    const out = await loadProductFormDraft('fitpic', 's1');
    expect(out).toBeNull();
  });

  test('clearProductFormDraft removes key', async () => {
    await clearProductFormDraft('standalone', 's2');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      productFormDraftStorageKey('standalone', 's2')
    );
  });
});
