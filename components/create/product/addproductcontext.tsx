// src/create/product/addproductcontext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { isValidProductUrl } from './link';
import { isColorOptionalForCategory } from './colorCategoryRules';

export const BRAND_MAX_LEN = 100;
export const COLOR_MAX_LEN = 100;

export type PriceType = 'fixed' | 'sale' | 'sold_out' | 'tbd' | 'na';

export type ProductFormData = {
  category: string;
  brand: string;
  productName: string;
  color: string;
  specifications: string;
  description: string;
  link: string;
  photos: string[];
  priceType: PriceType;
  price: string;
  originalPrice: string;
};

type BaselineState = {
  form: ProductFormData;
  selectedBrandId: string | null;
  brandConfirmed: boolean;
  productConfirmed: boolean;
  colorConfirmed: boolean;
};

function buildInitialForm(override?: Partial<ProductFormData>): ProductFormData {
  return {
    ...initialData,
    ...(override ?? {}),
    photos: Array.isArray(override?.photos) ? [...override.photos] : [...initialData.photos],
  };
}

export type AddProductInitialUiState = {
  isBrandConfirmed?: boolean;
  isProductConfirmed?: boolean;
  isColorConfirmed?: boolean;
};

function computeBaseline(
  initialForm?: Partial<ProductFormData>,
  initialBrandId?: string | null,
  initialUiState?: AddProductInitialUiState
): BaselineState {
  const form = buildInitialForm(initialForm);
  return {
    form,
    selectedBrandId: initialBrandId ?? null,
    brandConfirmed:
      initialUiState?.isBrandConfirmed ?? form.brand.trim().length >= 2,
    productConfirmed:
      initialUiState?.isProductConfirmed ?? form.productName.trim().length >= 2,
    colorConfirmed: initialUiState?.isColorConfirmed ?? form.color.trim().length > 0,
  };
}

type AddProductContextType = {
  category: string;
  brand: string;
  productName: string;
  color: string;
  specifications: string;
  description: string;
  link: string;
  photos: string[];
  priceType: PriceType;
  price: string;
  originalPrice: string;

  setCategory: (category: string) => void;
  setBrand: (brand: string) => void;
  setProductName: (name: string) => void;
  setColor: (color: string) => void;
  setSpecifications: (specs: string) => void;
  setDescription: (desc: string) => void;
  setLink: (link: string) => void;
  setPhotos: (photos: string[] | ((prev: string[]) => string[])) => void;
  setPriceType: (type: PriceType) => void;
  setPrice: (price: string) => void;
  setOriginalPrice: (price: string) => void;
  selectedBrandId: string | null;
  setBrandFromSuggestion: (brand: string, brandId: string) => void;
  isBrandConfirmed: boolean;
  isProductConfirmed: boolean;
  confirmBrandTyped: (brand: string) => void;
  clearBrandSelection: () => void;
  confirmProductName: (name: string) => void;
  clearProductSelection: () => void;

  isColorConfirmed: boolean;
  confirmColor: (value: string) => void;
  clearColorSelection: () => void;

  isValid: boolean;
  hasUnsavedChanges: boolean;
  reset: () => void;
};

const AddProductContext = createContext<AddProductContextType | null>(null);

const initialData: ProductFormData = {
  category: '',
  brand: '',
  productName: '',
  color: '',
  specifications: '',
  description: '',
  link: '',
  photos: [],
  priceType: 'fixed',
  price: '',
  originalPrice: '',
};

export type AddProductProviderProps = {
  children: React.ReactNode;
  initialForm?: Partial<ProductFormData>;
  initialBrandId?: string | null;
  initialUiState?: AddProductInitialUiState;
};

export function AddProductProvider({
  children,
  initialForm,
  initialBrandId = null,
  initialUiState,
}: AddProductProviderProps) {
  const [baseline] = useState(() =>
    computeBaseline(initialForm, initialBrandId, initialUiState)
  );

  const [formData, setFormData] = useState<ProductFormData>(() => ({
    ...baseline.form,
    photos: [...baseline.form.photos],
  }));
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    () => baseline.selectedBrandId
  );
  const [isBrandConfirmed, setIsBrandConfirmed] = useState(() => baseline.brandConfirmed);
  const [isProductConfirmed, setIsProductConfirmed] = useState(() => baseline.productConfirmed);
  const [isColorConfirmed, setIsColorConfirmed] = useState(() => baseline.colorConfirmed);

  const setCategory = useCallback((category: string) => {
    setFormData(prev => ({ ...prev, category }));
  }, []);

  const setBrand = useCallback((brand: string) => {
    setFormData(prev => ({ ...prev, brand }));
    setSelectedBrandId(null);
    setIsBrandConfirmed(false);
  }, []);

  const setBrandFromSuggestion = useCallback((brand: string, brandId: string) => {
    setFormData(prev => ({ ...prev, brand }));
    setSelectedBrandId(brandId);
    setIsBrandConfirmed(true);
  }, []);

  const confirmBrandTyped = useCallback((brandValue: string) => {
    const t = brandValue.trim();
    setFormData(prev => ({ ...prev, brand: t }));
    setSelectedBrandId(null);
    setIsBrandConfirmed(true);
  }, []);

  const clearBrandSelection = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      brand: '',
      productName: '',
      color: '',
    }));
    setSelectedBrandId(null);
    setIsBrandConfirmed(false);
    setIsProductConfirmed(false);
    setIsColorConfirmed(false);
  }, []);

  const setProductName = useCallback((productName: string) => {
    setFormData(prev => ({ ...prev, productName }));
  }, []);

  const setColor = useCallback((color: string) => {
    setFormData(prev => ({ ...prev, color }));
    setIsColorConfirmed(false);
  }, []);

  const confirmColor = useCallback((value: string) => {
    const t = value.trim().slice(0, COLOR_MAX_LEN);
    setFormData(prev => ({ ...prev, color: t }));
    setIsColorConfirmed(true);
  }, []);

  const clearColorSelection = useCallback(() => {
    setFormData(prev => ({ ...prev, color: '' }));
    setIsColorConfirmed(false);
  }, []);

  const confirmProductName = useCallback((name: string) => {
    const t = name.trim();
    setFormData(prev => ({ ...prev, productName: t }));
    setIsProductConfirmed(true);
  }, []);

  const clearProductSelection = useCallback(() => {
    setFormData(prev => ({ ...prev, productName: '', color: '' }));
    setIsProductConfirmed(false);
    setIsColorConfirmed(false);
  }, []);

  const setSpecifications = useCallback((specifications: string) => {
    setFormData(prev => ({ ...prev, specifications }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setFormData(prev => ({ ...prev, description }));
  }, []);

  const setLink = useCallback((link: string) => {
    setFormData(prev => ({ ...prev, link }));
  }, []);

  const setPhotos = useCallback((photos: string[] | ((prev: string[]) => string[])) => {
    setFormData(prev => ({
      ...prev,
      photos: typeof photos === 'function' ? photos(prev.photos) : photos,
    }));
  }, []);

  const setPriceType = useCallback((priceType: PriceType) => {
    setFormData(prev => ({ ...prev, priceType }));
  }, []);

  const setPrice = useCallback((price: string) => {
    setFormData(prev => ({ ...prev, price }));
  }, []);

  const setOriginalPrice = useCallback((originalPrice: string) => {
    setFormData(prev => ({ ...prev, originalPrice }));
  }, []);

  const isValid = useMemo(() => {
    const colorOk =
      isColorOptionalForCategory(formData.category) ||
      formData.color.trim().length > 0;
    const colorLenOk = formData.color.trim().length <= COLOR_MAX_LEN;
    return (
      formData.category.trim().length > 0 &&
      formData.brand.trim().length >= 2 &&
      formData.brand.trim().length <= BRAND_MAX_LEN &&
      formData.productName.trim().length >= 2 &&
      formData.productName.trim().length <= 100 &&
      colorOk &&
      colorLenOk &&
      formData.photos.length >= 1 &&
      formData.photos.length <= 5 &&
      isValidProductUrl(formData.link) &&
      (formData.priceType === 'tbd' || formData.priceType === 'na' || formData.priceType === 'sold_out' || formData.price.trim().length > 0)
    );
  }, [formData]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(baseline.form);
  }, [formData, baseline.form]);

  const reset = useCallback(() => {
    setFormData({ ...baseline.form, photos: [...baseline.form.photos] });
    setSelectedBrandId(baseline.selectedBrandId);
    setIsBrandConfirmed(baseline.brandConfirmed);
    setIsProductConfirmed(baseline.productConfirmed);
    setIsColorConfirmed(baseline.colorConfirmed);
  }, [baseline]);

  const value: AddProductContextType = {
    ...formData,
    setCategory,
    setBrand,
    setProductName,
    setColor,
    setSpecifications,
    setDescription,
    setLink,
    setPhotos,
    setPriceType,
    setPrice,
    setOriginalPrice,
    selectedBrandId,
    setBrandFromSuggestion,
    isBrandConfirmed,
    isProductConfirmed,
    confirmBrandTyped,
    clearBrandSelection,
    confirmProductName,
    clearProductSelection,
    isColorConfirmed,
    confirmColor,
    clearColorSelection,
    isValid,
    hasUnsavedChanges,
    reset,
  };

  return (
    <AddProductContext.Provider value={value}>
      {children}
    </AddProductContext.Provider>
  );
}

export function useAddProductContext() {
  const context = useContext(AddProductContext);
  if (!context) {
    throw new Error('useAddProductContext must be used within AddProductProvider');
  }
  return context;
}
