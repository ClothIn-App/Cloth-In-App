// app/create-modals/addproduct.tsx
import * as React from 'react';
import { View, StyleSheet, Alert, Modal, Pressable, Text, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import { useAddProductContext, AddProductProvider } from '../../components/create/product/addproductcontext';
import CategorySelect from '../../components/create/product/categoryselect';
import BrandSelect from '../../components/create/product/brandselect';
import ProductName from '../../components/create/product/productname';
import SpecificationsDescription from '../../components/create/product/specificationsdescription';
import ProductLink from '../../components/create/product/link';
import ProductPhotos from '../../components/create/product/productphotos';
import AddPrice from '../../components/create/product/addprice';

function AddProductContent() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  
  const {
    category,
    brand,
    productName,
    specifications,
    description,
    link,
    photos,
    priceType,
    price,
    originalPrice,
    isValid,
    hasUnsavedChanges,
    reset,
  } = useAddProductContext();

  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

  const handleClose = React.useCallback(() => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      router.back();
    }
  }, [hasUnsavedChanges, router]);

  const handleDiscard = React.useCallback(() => {
    reset();
    setShowDiscardConfirm(false);
    router.back();
  }, [reset, router]);

  const handleCancelDiscard = React.useCallback(() => {
    setShowDiscardConfirm(false);
  }, []);

  const handleAddProduct = React.useCallback(() => {
    if (!isValid) return;
    
    // TODO: Implement actual product creation logic
    console.log('Adding product:', {
      category,
      brand,
      productName,
      specifications,
      description,
      link,
      photos,
      priceType,
      price,
      originalPrice,
    });
    
    // For now, just go back
    router.back();
  }, [isValid, category, brand, productName, specifications, description, link, photos, priceType, price, originalPrice, router]);

  // Calculate header height similar to fitpic_post
  const topPad = Math.max(insets.top - 6, 0);
  const headerHeight = 60 + topPad;
  const footerSafePad = insets.bottom;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, height: headerHeight }]}>
        <Pressable onPress={handleClose} hitSlop={8} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </Pressable>
        
        <Text style={styles.headerTitle}>New Product</Text>
        
        <Pressable
          onPress={handleAddProduct}
          hitSlop={8}
          style={[styles.headerButton, !isValid && styles.headerButtonDisabled]}
          disabled={!isValid}
        >
          <Text style={[styles.headerButtonText, !isValid && styles.headerButtonTextDisabled]}>
            Post
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
      >
        <CategorySelect />
        <BrandSelect />
        <ProductName />
        <SpecificationsDescription />
        <ProductLink />
        <ProductPhotos />
        <AddPrice />
        
        {/* Spacer so last content isn't obscured by sticky footer */}
        <View style={{ height: 64 + footerSafePad }} />
      </ScrollView>

      {/* Sticky Footer */}
      <SafeAreaView style={[styles.footer, { paddingBottom: footerSafePad }]} edges={[]}>
        <Pressable
          onPress={handleAddProduct}
          style={[styles.addButton, !isValid && styles.addButtonDisabled]}
          disabled={!isValid}
        >
          <Text style={[styles.addButtonText, !isValid && styles.addButtonTextDisabled]}>
            Add Product
          </Text>
        </Pressable>
      </SafeAreaView>

      {/* Discard Changes Confirmation */}
      <Modal visible={showDiscardConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Discard changes?</Text>
            <Text style={styles.confirmMessage}>
              You have unsaved changes. Are you sure you want to discard them?
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable onPress={handleCancelDiscard} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleDiscard} style={[styles.confirmButton, styles.confirmButtonDanger]}>
                <Text style={[styles.confirmButtonText, styles.confirmButtonTextDanger]}>
                  Discard
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  headerButtonTextDisabled: {
    color: '#9ca3af',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonTextDisabled: {
    color: '#9ca3af',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmButtonDanger: {
    backgroundColor: '#fef2f2',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButtonTextDanger: {
    color: '#dc2626',
  },
});

export default function AddProductScreen() {
  return (
    <AddProductProvider>
      <AddProductContent />
    </AddProductProvider>
  );
}
