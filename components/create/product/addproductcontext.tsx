// src/create/product/addproductcontext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type PriceType = 'fixed' | 'sale' | 'sold_out' | 'tbd' | 'na';

export type ProductFormData = {
  category: string;
  brand: string;
  productName: string;
  specifications: string;
  description: string;
  link: string;
  photos: string[];
  priceType: PriceType;
  price: string;
  originalPrice: string;
};

type AddProductContextType = {
  // Form data
  category: string;
  brand: string;
  productName: string;
  specifications: string;
  description: string;
  link: string;
  photos: string[];
  priceType: PriceType;
  price: string;
  originalPrice: string;
  
  // Actions
  setCategory: (category: string) => void;
  setBrand: (brand: string) => void;
  setProductName: (name: string) => void;
  setSpecifications: (specs: string) => void;
  setDescription: (desc: string) => void;
  setLink: (link: string) => void;
  setPhotos: (photos: string[] | ((prev: string[]) => string[])) => void;
  setPriceType: (type: PriceType) => void;
  setPrice: (price: string) => void;
  setOriginalPrice: (price: string) => void;
  
  // Computed
  isValid: boolean;
  hasUnsavedChanges: boolean;
  reset: () => void;
};

const AddProductContext = createContext<AddProductContextType | null>(null);

const initialData: ProductFormData = {
  category: '',
  brand: '',
  productName: '',
  specifications: '',
  description: '',
  link: '',
  photos: [],
  priceType: 'fixed',
  price: '',
  originalPrice: '',
};

export function AddProductProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<ProductFormData>(initialData);
  const [initialFormData] = useState<ProductFormData>(initialData);

  const setCategory = useCallback((category: string) => {
    setFormData(prev => ({ ...prev, category }));
  }, []);

  const setBrand = useCallback((brand: string) => {
    setFormData(prev => ({ ...prev, brand }));
  }, []);

  const setProductName = useCallback((productName: string) => {
    setFormData(prev => ({ ...prev, productName }));
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
    return (
      formData.category.trim().length > 0 &&
      formData.brand.trim().length >= 2 &&
      formData.brand.trim().length <= 50 &&
      formData.productName.trim().length >= 2 &&
      formData.productName.trim().length <= 100 &&
      formData.photos.length >= 1 &&
      formData.photos.length <= 5 &&
      (formData.priceType === 'tbd' || formData.priceType === 'na' || formData.price.trim().length > 0)
    );
  }, [formData]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  const reset = useCallback(() => {
    setFormData(initialData);
  }, []);

  const value: AddProductContextType = {
    ...formData,
    setCategory,
    setBrand,
    setProductName,
    setSpecifications,
    setDescription,
    setLink,
    setPhotos,
    setPriceType,
    setPrice,
    setOriginalPrice,
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
