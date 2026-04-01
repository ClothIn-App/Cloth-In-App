// app/create-modals/addproduct.tsx
import * as React from 'react';
import { View, StyleSheet, Alert, Modal, Pressable, Text, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';

import { useAddProductContext, AddProductProvider } from '../../components/create/product/addproductcontext';
import { usePost } from '../../components/create/post/postcontext';
import { uploadProductPhotos, PhotoUploadRequest } from '@/src/services/photoUploadService';
import { contentApiClient, CreateProductRequest } from '@/src/services/apiClients/contentClient';
import { clearFeedCache } from '@/src/utils/getFeedItem';
import CategorySelect from '../../components/create/product/categoryselect';
import BrandSelect from '../../components/create/product/brandselect';
import ProductName from '../../components/create/product/productname';
import ProductColor from '../../components/create/product/productcolor';
import SpecificationsDescription from '../../components/create/product/specificationsdescription';
import ProductLink from '../../components/create/product/link';
import ProductPhotos from '../../components/create/product/productphotos';
import AddPrice from '../../components/create/product/addprice';

/** Derive a string image URL from create-product response (server returns images as [{ url }], mock may use imagePath or string[]). */
function getProductImageUrl(p: {
  primaryImageUrl?: string;
  images?: Array<{ url?: string } | string>;
  imagePath?: string;
}): string | undefined {
  if (typeof p.primaryImageUrl === 'string' && p.primaryImageUrl) return p.primaryImageUrl;
  const first = p.images?.[0];
  if (first != null) {
    if (typeof first === 'string') return first;
    if (typeof first === 'object' && typeof first.url === 'string') return first.url;
  }
  if (typeof p.imagePath === 'string' && p.imagePath) return p.imagePath;
  return undefined;
}

function AddProductContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const { addProduct } = usePost();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const {
    category,
    brand,
    selectedBrandId,
    productName,
    color,
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

  const handleAddProduct = React.useCallback(async () => {
    if (!isValid) return;

    try {
      // Generate product ID once for storage path and Firestore document
      const productId = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

      const uploadRequests: PhotoUploadRequest[] = photos.map((uri, index) => ({
        uri,
        type: "image/jpeg",
        name: `product_${Date.now()}_${index}.jpg`,
      }));

      const uploadResult = await uploadProductPhotos(uploadRequests, productId);

      if (!uploadResult.success) {
        const message = uploadResult.errors?.[0] ?? "Failed to upload product photos. Please try again.";
        Alert.alert("Upload failed", message, [{ text: "OK" }]);
        return;
      }

      const uploadedUrls =
        uploadResult.uploads
          .filter((u) => u.success && u.url)
          .map((u) => u.url as string);

      if (!uploadedUrls.length) {
        Alert.alert("Upload failed", "No photo URLs were returned from the server.", [{ text: "OK" }]);
        return;
      }

      const parsedPrice = price.trim().length > 0 ? Number(price) : undefined;
      const parsedOriginalPrice = originalPrice.trim().length > 0 ? Number(originalPrice) : undefined;

      const requestBody: CreateProductRequest = {
        productId,
        name: productName.trim(),
        brand: brand.trim(),
        ...(selectedBrandId ? { brandId: selectedBrandId } : {}),
        category: category.trim(),
        ...(color.trim() ? { color: color.trim() } : {}),
        description: description.trim() || undefined,
        specifications: specifications.trim() || undefined,
        productUrl: link.trim() || undefined,
        priceType,
        price:
          priceType === "fixed" || priceType === "sale" || priceType === "sold_out"
            ? parsedPrice
            : undefined,
        originalPrice: parsedOriginalPrice,
        currency: "USD",
        images: uploadedUrls.map((url) => ({ url })),
      };

      const response = await contentApiClient.createProduct(requestBody);

      if (!response.success) {
        Alert.alert("Error", response.error ?? "Failed to create product. Please try again.", [
          { text: "OK" },
        ]);
        return;
      }

      if (params.returnTo === "fitpic" && response.product) {
        const p = response.product;
        const imageUrl = getProductImageUrl(p);
        addProduct({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: "",
          price: p.price,
          imageUrl,
        });
      }

      // Reset form, clear feed cache so the new product can appear, and navigate back
      reset();
      clearFeedCache();
      router.back();
    } catch (error) {
      console.error("Error creating product:", error);
      Alert.alert("Error", "Failed to create product. Please try again.", [{ text: "OK" }]);
    }
  }, [
    isValid,
    category,
    brand,
    productName,
    color,
    specifications,
    description,
    link,
    photos,
    priceType,
    price,
    originalPrice,
    selectedBrandId,
    reset,
    router,
    params.returnTo,
    addProduct,
  ]);

  // Flow bar: count how many of the 8 fields have any input (0–8)
  const filledCount = React.useMemo(() => {
    let count = 0;
    if (category.trim().length > 0) count += 1;
    if (brand.trim().length > 0) count += 1;
    if (productName.trim().length > 0) count += 1;
    if (color.trim().length > 0) count += 1;
    if (specifications.trim().length > 0 || description.trim().length > 0) count += 1;
    if (link.trim().length > 0) count += 1;
    if (photos.length > 0) count += 1;
    const priceFilled =
      priceType === 'tbd' ||
      priceType === 'na' ||
      price.trim().length > 0 ||
      originalPrice.trim().length > 0;
    if (priceFilled) count += 1;
    return count;
  }, [
    category,
    brand,
    productName,
    color,
    specifications,
    description,
    link,
    photos.length,
    priceType,
    price,
    originalPrice,
  ]);

  // Calculate header height: top row + flow bar
  const topPad = Math.max(insets.top - 6, 0);
  const FLOW_BAR_HEIGHT = 8;
  const headerHeight = 60 + topPad + FLOW_BAR_HEIGHT + 4;
  const footerSafePad = insets.bottom;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, height: headerHeight }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.headerButton}>
            <Ionicons name="chevron-back-outline" size={24} color="#111827" />
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
        <View style={styles.flowBarContainer}>
          <View
            style={[styles.flowBarFill, { width: `${(filledCount / 8) * 100}%` }]}
          />
        </View>
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
        <ProductColor />
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
    flexDirection: 'column',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
  },
  flowBarContainer: {
    height: 8,
    width: '100%',
    marginTop: 0,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  flowBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
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
    paddingTop: 24,
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
