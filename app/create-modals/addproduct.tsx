// app/create-modals/addproduct.tsx
import * as React from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import {
  useAddProductContext,
  AddProductProvider,
  type AddProductInitialUiState,
} from '../../components/create/product/addproductcontext';
import { usePost } from '../../components/create/post/postcontext';
import { uploadProductPhotos, PhotoUploadRequest } from '@/src/services/photoUploadService';
import {
  contentApiClient,
  CreateProductRequest,
  type ProductMatchCandidate,
} from '@/src/services/apiClients/contentClient';
import { clearFeedCache } from '@/src/utils/getFeedItem';
import { ProductFormBody } from '../../components/create/product/ProductFormBody';
import { ProductMatchInterrupt } from '@/src/components/create/product/ProductMatchInterrupt';
import { useCreateModalsSession } from '@/src/create/product/createModalsSessionContext';
import {
  DEFAULT_RESUME_FOR_FITPIC,
  DEFAULT_RESUME_FOR_STANDALONE,
  parseSourceFlow,
  type ProductCreationSourceFlow,
} from '@/src/create/product/productCreationFlowTypes';
import {
  clearActiveProductCreationReturnContext,
  patchActiveResolvedProductOutcome,
  setActiveProductCreationReturnContext,
} from '@/src/create/product/productCreationFlowRuntime';
import {
  cleanupStaleSessionDraft,
  clearProductFormDraft,
  loadProductFormDraft,
  saveProductFormDraft,
  PRODUCT_FORM_DRAFT_VERSION,
  type ProductFormDraftSnapshot,
} from '@/src/create/product/productFormDraftStorage';

function paramOne(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

type FlowConfig = {
  sourceFlow: ProductCreationSourceFlow;
  draftSessionId: string;
  resumeRoute: string;
};

function resolveFlow(
  params: Record<string, string | string[] | undefined>,
  draftSessionId: string
): FlowConfig {
  const returnTo = paramOne(params.returnTo);
  const rawSource = paramOne(params.sourceFlow);
  let sourceFlow = parseSourceFlow(rawSource);
  if (!sourceFlow && returnTo === 'fitpic') {
    sourceFlow = 'fitpic';
  }
  if (!sourceFlow) {
    if (__DEV__) {
      console.warn(
        '[add-product] Missing sourceFlow (and not legacy returnTo=fitpic); defaulting to standalone. New entry points must pass sourceFlow.'
      );
    }
    sourceFlow = 'standalone';
  }

  const resumeFromParam = paramOne(params.resumeRoute);
  const resumeRoute =
    resumeFromParam ??
    (sourceFlow === 'fitpic'
      ? DEFAULT_RESUME_FOR_FITPIC.resumeRoute
      : DEFAULT_RESUME_FOR_STANDALONE.resumeRoute);

  return { sourceFlow, draftSessionId, resumeRoute };
}

/** Derive a string image URL from create-product response (server returns images as [{ url }], mock may use imagePath or string[]). */
function getProductImageUrl(p: {
  primaryImageUrl?: string;
  images?: ({ url?: string } | string)[];
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

function snapshotFromContext(ctx: ReturnType<typeof useAddProductContext>): ProductFormDraftSnapshot {
  return {
    version: PRODUCT_FORM_DRAFT_VERSION,
    form: {
      category: ctx.category,
      brand: ctx.brand,
      productName: ctx.productName,
      color: ctx.color,
      specifications: ctx.specifications,
      description: ctx.description,
      link: ctx.link,
      photos: [...ctx.photos],
      priceType: ctx.priceType,
      price: ctx.price,
      originalPrice: ctx.originalPrice,
    },
    selectedBrandId: ctx.selectedBrandId,
    isBrandConfirmed: ctx.isBrandConfirmed,
    isProductConfirmed: ctx.isProductConfirmed,
    isColorConfirmed: ctx.isColorConfirmed,
  };
}

type AddProductContentProps = { flow: FlowConfig };

function AddProductContent({ flow }: AddProductContentProps) {
  const router = useRouter();
  const { addProduct } = usePost();
  const insets = useSafeAreaInsets();

  const ctx = useAddProductContext();
  const ctxRef = React.useRef(ctx);
  ctxRef.current = ctx;

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
    isBrandConfirmed,
    isProductConfirmed,
    isColorConfirmed,
  } = ctx;

  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);
  const [isMatchChecking, setIsMatchChecking] = React.useState(false);
  const [matchCandidates, setMatchCandidates] = React.useState<ProductMatchCandidate[] | null>(null);

  // Holds candidates to restore when the user presses back from editproduct.
  // The Modal must be dismissed before pushing editproduct (otherwise it renders
  // on top of the new screen), so we stash the list here and revive it on focus.
  const pendingCandidatesRef = React.useRef<ProductMatchCandidate[] | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (pendingCandidatesRef.current) {
        setMatchCandidates(pendingCandidatesRef.current);
        pendingCandidatesRef.current = null;
      }
    }, [])
  );

  React.useEffect(() => {
    const snap = snapshotFromContext(ctxRef.current);
    const t = setTimeout(() => {
      void saveProductFormDraft(flow.sourceFlow, flow.draftSessionId, snap);
    }, 400);
    return () => clearTimeout(t);
  }, [
    flow.sourceFlow,
    flow.draftSessionId,
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
    isBrandConfirmed,
    isProductConfirmed,
    isColorConfirmed,
  ]);

  React.useEffect(() => {
    return () => {
      void saveProductFormDraft(
        flow.sourceFlow,
        flow.draftSessionId,
        snapshotFromContext(ctxRef.current)
      );
    };
  }, [flow.sourceFlow, flow.draftSessionId]);

  const handleClose = React.useCallback(() => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      patchActiveResolvedProductOutcome({ kind: 'cancelled' });
      router.back();
    }
  }, [hasUnsavedChanges, router]);

  const handleDiscard = React.useCallback(async () => {
    await clearProductFormDraft(flow.sourceFlow, flow.draftSessionId);
    patchActiveResolvedProductOutcome({ kind: 'cancelled' });
    reset();
    setShowDiscardConfirm(false);
    router.back();
  }, [flow.draftSessionId, flow.sourceFlow, reset, router]);

  const handleCancelDiscard = React.useCallback(() => {
    setShowDiscardConfirm(false);
  }, []);

  // Performs the real product create (photos upload + API call). Called either
  // directly (no matches found / check failed) or after all candidates are rejected.
  const executeProductCreate = React.useCallback(async () => {
    try {
      const productId = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const uploadRequests: PhotoUploadRequest[] = photos.map((uri, index) => ({
        uri,
        type: 'image/jpeg',
        name: `product_${Date.now()}_${index}.jpg`,
      }));

      const uploadResult = await uploadProductPhotos(uploadRequests, productId);

      if (!uploadResult.success) {
        const message = uploadResult.errors?.[0] ?? 'Failed to upload product photos. Please try again.';
        Alert.alert('Upload failed', message, [{ text: 'OK' }]);
        return;
      }

      const uploadedUrls = uploadResult.uploads
        .filter((u) => u.success && u.url)
        .map((u) => u.url as string);

      if (!uploadedUrls.length) {
        Alert.alert('Upload failed', 'No photo URLs were returned from the server.', [{ text: 'OK' }]);
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
          priceType === 'fixed' || priceType === 'sale' || priceType === 'sold_out'
            ? parsedPrice
            : undefined,
        originalPrice: parsedOriginalPrice,
        currency: 'USD',
        images: uploadedUrls.map((url) => ({ url })),
      };

      const response = await contentApiClient.createProduct(requestBody);

      if (!response.success) {
        Alert.alert('Error', response.error ?? 'Failed to create product. Please try again.', [
          { text: 'OK' },
        ]);
        return;
      }

      const p = response.product;
      if (p?.id) {
        patchActiveResolvedProductOutcome({ kind: 'created', productId: p.id });
      }

      if (flow.sourceFlow === 'fitpic' && p) {
        const imageUrl = getProductImageUrl(p);
        addProduct({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: '',
          price: p.price,
          imageUrl,
        });
      }

      await clearProductFormDraft(flow.sourceFlow, flow.draftSessionId);
      reset();
      clearFeedCache();
      router.back();
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to create product. Please try again.', [{ text: 'OK' }]);
    }
  }, [
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
    addProduct,
    flow.sourceFlow,
    flow.draftSessionId,
  ]);

  // Gate: run pre-create match check, interrupt if matches found, fall through otherwise.
  const handleAddProduct = React.useCallback(async () => {
    if (!isValid || isMatchChecking) return;

    setIsMatchChecking(true);
    try {
      const result = await contentApiClient.productMatchCheck({
        name: productName.trim(),
        brand: brand.trim(),
        ...(selectedBrandId ? { brandId: selectedBrandId } : {}),
        ...(color.trim() ? { color: color.trim() } : {}),
      });

      if (result.matches.length > 0) {
        setMatchCandidates(result.matches);
        return;
      }

      await executeProductCreate();
    } catch {
      // Fail-open: match check errors must never block creation.
      await executeProductCreate();
    } finally {
      setIsMatchChecking(false);
    }
  }, [
    isValid,
    isMatchChecking,
    productName,
    brand,
    selectedBrandId,
    color,
    executeProductCreate,
  ]);

  // "Yes" — attach the confirmed existing product and return to calling flow.
  const handleMatchConfirm = React.useCallback(async (candidate: ProductMatchCandidate) => {
    patchActiveResolvedProductOutcome({ kind: 'matched', productId: candidate.productId });

    if (flow.sourceFlow === 'fitpic') {
      const { preview } = candidate;
      addProduct({
        id: candidate.productId,
        name: preview.name,
        brand: preview.brand ?? '',
        category: '',
        price: undefined,
        imageUrl: preview.imageUrl,
      });
    }

    await clearProductFormDraft(flow.sourceFlow, flow.draftSessionId);
    reset();
    setMatchCandidates(null);
    router.back();
  }, [
    flow.sourceFlow,
    flow.draftSessionId,
    addProduct,
    reset,
    router,
  ]);

  // "Yes, Edit Product" — attach the matched product immediately (same as handleMatchConfirm),
  // clear the form draft, then hand off to the edit screen with full return context.
  const handleMatchConfirmEdit = React.useCallback(async (candidate: ProductMatchCandidate) => {
    patchActiveResolvedProductOutcome({ kind: 'matched', productId: candidate.productId });

    if (flow.sourceFlow === 'fitpic') {
      const { preview } = candidate;
      addProduct({
        id: candidate.productId,
        name: preview.name,
        brand: preview.brand ?? '',
        category: '',
        price: undefined,
        imageUrl: preview.imageUrl,
      });
    }

    await clearProductFormDraft(flow.sourceFlow, flow.draftSessionId);
    reset();
    // Stash current candidates so they can be restored when the user presses
    // back from editproduct. We must dismiss the Modal before pushing because
    // React Native renders Modals above all navigation screens — leaving it
    // open would cover editproduct entirely.
    pendingCandidatesRef.current = matchCandidates;
    setMatchCandidates(null);
    router.push({
      pathname: '/create-modals/editproduct' as never,
      params: {
        productId: candidate.productId,
        resumeRoute: flow.resumeRoute,
      },
    });
  }, [flow.sourceFlow, flow.draftSessionId, flow.resumeRoute, addProduct, reset, router, matchCandidates]);

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

  const topPad = Math.max(insets.top - 6, 0);
  const FLOW_BAR_HEIGHT = 8;
  const headerHeight = 60 + topPad + FLOW_BAR_HEIGHT + 4;
  const footerSafePad = insets.bottom;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={[styles.header, { paddingTop: topPad, height: headerHeight }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.headerButton}>
            <Ionicons name="chevron-back-outline" size={24} color="#111827" />
          </Pressable>

          <Pressable
            onPress={() => void handleAddProduct()}
            hitSlop={8}
            style={[styles.headerButton, (!isValid || isMatchChecking) && styles.headerButtonDisabled]}
            disabled={!isValid || isMatchChecking}
          >
            <Text style={[styles.headerButtonText, (!isValid || isMatchChecking) && styles.headerButtonTextDisabled]}>
              {isMatchChecking ? 'Checking…' : 'Add Product'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.flowBarContainer}>
          <View style={[styles.flowBarFill, { width: `${(filledCount / 8) * 100}%` }]} />
        </View>
      </View>

      <ProductFormBody footerSpacerHeight={64 + footerSafePad} />

      <SafeAreaView style={[styles.footer, { paddingBottom: footerSafePad }]} edges={[]}>
        <Pressable
          onPress={() => void handleAddProduct()}
          style={[styles.addButton, (!isValid || isMatchChecking) && styles.addButtonDisabled]}
          disabled={!isValid || isMatchChecking}
        >
          {isMatchChecking ? (
            <ActivityIndicator size="small" color="#9ca3af" />
          ) : (
            <Text style={[styles.addButtonText, !isValid && styles.addButtonTextDisabled]}>
              Add Product
            </Text>
          )}
        </Pressable>
      </SafeAreaView>

      {matchCandidates && (
        <ProductMatchInterrupt
          candidates={matchCandidates}
          sourceFlow={flow.sourceFlow}
          onConfirm={(candidate) => void handleMatchConfirm(candidate)}
          onConfirmEdit={(candidate) => void handleMatchConfirmEdit(candidate)}
          onAllRejected={() => {
            setMatchCandidates(null);
            void executeProductCreate();
          }}
        />
      )}

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
              <Pressable
                onPress={() => void handleDiscard()}
                style={[styles.confirmButton, styles.confirmButtonDanger]}
              >
                <Text style={[styles.confirmButtonText, styles.confirmButtonTextDanger]}>Discard</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
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
  const params = useLocalSearchParams<{
    returnTo?: string;
    sourceFlow?: string;
    resumeRoute?: string;
  }>();
  const { draftSessionId } = useCreateModalsSession();

  const flow = React.useMemo(() => resolveFlow(params, draftSessionId), [params, draftSessionId]);

  const [loadedSnapshot, setLoadedSnapshot] = React.useState<ProductFormDraftSnapshot | null | undefined>(
    undefined
  );

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const snap = await loadProductFormDraft(flow.sourceFlow, flow.draftSessionId);
      if (!cancelled) {
        setLoadedSnapshot(snap ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [flow.sourceFlow, flow.draftSessionId]);

  React.useEffect(() => {
    if (__DEV__) {
      if (!draftSessionId) {
        console.warn('[add-product] Missing draftSessionId from CreateModalsSessionProvider');
      }
    }
    setActiveProductCreationReturnContext({
      sourceFlow: flow.sourceFlow,
      draftSessionId: flow.draftSessionId,
      resume: {
        resumeRoute: flow.resumeRoute,
        presentation: { stack: 'create-modals' },
      },
      resolvedProductOutcome: { kind: 'pending' },
    });
    void cleanupStaleSessionDraft(flow.sourceFlow, flow.draftSessionId);
    return () => clearActiveProductCreationReturnContext();
  }, [flow.draftSessionId, flow.resumeRoute, flow.sourceFlow, draftSessionId]);

  if (loadedSnapshot === undefined) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const initialUiState: AddProductInitialUiState | undefined = loadedSnapshot
    ? {
        isBrandConfirmed: loadedSnapshot.isBrandConfirmed,
        isProductConfirmed: loadedSnapshot.isProductConfirmed,
        isColorConfirmed: loadedSnapshot.isColorConfirmed,
      }
    : undefined;

  return (
    <AddProductProvider
      key={`${flow.sourceFlow}-${flow.draftSessionId}`}
      initialForm={loadedSnapshot?.form}
      initialBrandId={loadedSnapshot?.selectedBrandId ?? null}
      initialUiState={initialUiState}
    >
      <AddProductContent flow={flow} />
    </AddProductProvider>
  );
}
