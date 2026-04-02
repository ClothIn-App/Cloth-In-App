import * as React from "react";
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  Text,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  AddProductProvider,
  useAddProductContext,
  type PriceType,
} from "@/components/create/product/addproductcontext";
import { ProductFormBody } from "@/components/create/product/ProductFormBody";
import {
  contentApiClient,
  type SubmitProductEditSuggestionRequest,
} from "@/src/services/apiClients/contentClient";
import { uploadProductPhotos, type PhotoUploadRequest } from "@/src/services/photoUploadService";
import { ApiError } from "@/src/services/http";
import { takeProductForEditIfMatch } from "@/src/utils/productEditHandoff";
import { mapProductToInitialForm } from "@/src/utils/mapProductToEditForm";
import { setPendingEditSubmissionThankYou } from "@/src/utils/pendingEditSubmissionToast";
import { normalizeProduct } from "@/src/hooks/useProductData";
import type { Product } from "@/src/types/content";

function isRemoteImageUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

async function buildImagesForSubmit(
  photos: string[],
  productId: string
): Promise<{ ok: true; images: { url: string }[] } | { ok: false; error: string }> {
  type Slot = { kind: "remote"; url: string } | { kind: "local"; uri: string };
  const slots: Slot[] = photos.map((uri) =>
    isRemoteImageUri(uri) ? { kind: "remote", url: uri } : { kind: "local", uri }
  );
  const locals = slots.filter((s): s is { kind: "local"; uri: string } => s.kind === "local");

  let uploads: Awaited<ReturnType<typeof uploadProductPhotos>> | null = null;
  if (locals.length) {
    const requests: PhotoUploadRequest[] = locals.map((l, i) => ({
      uri: l.uri,
      type: "image/jpeg",
      name: `product_edit_${Date.now()}_${i}.jpg`,
    }));
    uploads = await uploadProductPhotos(requests, productId);
    if (!uploads.success) {
      return { ok: false, error: uploads.errors?.[0] ?? "Failed to upload photos." };
    }
  }

  const urls: string[] = [];
  let localResultIndex = 0;
  for (const s of slots) {
    if (s.kind === "remote") {
      urls.push(s.url);
    } else {
      const u = uploads!.uploads[localResultIndex++];
      if (!u?.success || !u.url) {
        return { ok: false, error: u?.error ?? "Photo upload failed." };
      }
      urls.push(u.url);
    }
  }

  return { ok: true, images: urls.map((url) => ({ url })) };
}

function messageForEditSubmitError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 422) {
      return "No changes detected. Update at least one field compared to the current catalog entry.";
    }
    if (err.status === 404) {
      return "This product is no longer available.";
    }
    if (err.status === 401) {
      return "Please sign in to submit an edit.";
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

function serializeInitialProductEditSnapshot(
  initialFormSnapshot: ReturnType<typeof mapProductToInitialForm>,
  initialBrandId: string | null
): string {
  return JSON.stringify({
    ...initialFormSnapshot,
    photos: initialFormSnapshot.photos ?? [],
    selectedBrandId: initialBrandId,
  });
}

type CurrentProductEditFormSlice = {
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
  selectedBrandId: string | null;
};

function serializeCurrentProductEditForm(slice: CurrentProductEditFormSlice): string {
  return JSON.stringify({
    category: slice.category.trim(),
    brand: slice.brand.trim(),
    productName: slice.productName.trim(),
    color: slice.color.trim(),
    specifications: slice.specifications.trim(),
    description: slice.description.trim(),
    link: slice.link.trim(),
    photos: slice.photos,
    priceType: slice.priceType,
    price: slice.price.trim(),
    originalPrice: slice.originalPrice.trim(),
    selectedBrandId: slice.selectedBrandId,
  });
}

function isProductEditFormUnchanged(
  initialFormSnapshot: ReturnType<typeof mapProductToInitialForm>,
  initialBrandId: string | null,
  current: CurrentProductEditFormSlice
): boolean {
  return (
    serializeInitialProductEditSnapshot(initialFormSnapshot, initialBrandId) ===
    serializeCurrentProductEditForm(current)
  );
}

type EditProductInnerProps = {
  productId: string;
  initialProduct: Product;
};

function EditProductContent({ productId, initialProduct }: EditProductInnerProps) {
  const initialForm = React.useMemo(
    () => mapProductToInitialForm(initialProduct),
    [initialProduct]
  );

  return (
    <AddProductProvider
      key={productId}
      initialForm={initialForm}
      initialBrandId={initialProduct.brandId ?? null}
    >
      <EditProductFormShell
        productId={productId}
        initialFormSnapshot={initialForm}
        initialBrandId={initialProduct.brandId ?? null}
      />
    </AddProductProvider>
  );
}

type ShellProps = {
  productId: string;
  initialFormSnapshot: ReturnType<typeof mapProductToInitialForm>;
  initialBrandId: string | null;
};

function EditProductFormShell({
  productId,
  initialFormSnapshot,
  initialBrandId,
}: ShellProps) {
  const router = useRouter();
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
  const [submitting, setSubmitting] = React.useState(false);

  const currentFormSlice = React.useMemo<CurrentProductEditFormSlice>(
    () => ({
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
    }),
    [
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
    ]
  );

  const hasChanges = React.useMemo(
    () => !isProductEditFormUnchanged(initialFormSnapshot, initialBrandId, currentFormSlice),
    [initialFormSnapshot, initialBrandId, currentFormSlice]
  );

  const canSubmit = isValid && hasChanges && !submitting;

  const handleClose = React.useCallback(() => {
    if (hasUnsavedChanges) setShowDiscardConfirm(true);
    else router.back();
  }, [hasUnsavedChanges, router]);

  const handleDiscard = React.useCallback(() => {
    reset();
    setShowDiscardConfirm(false);
    router.back();
  }, [reset, router]);

  const handleSubmit = React.useCallback(async () => {
    if (!isValid || submitting) return;

    if (
      isProductEditFormUnchanged(initialFormSnapshot, initialBrandId, {
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
      })
    ) {
      Alert.alert(
        "No changes",
        "Update at least one field before submitting.",
        [{ text: "OK" }]
      );
      return;
    }

    setSubmitting(true);
    try {
      const imgResult = await buildImagesForSubmit(photos, productId);
      if (!imgResult.ok) {
        Alert.alert("Upload failed", imgResult.error, [{ text: "OK" }]);
        return;
      }

      const parsedPrice = price.trim().length > 0 ? Number(price) : undefined;
      const parsedOriginalPrice =
        originalPrice.trim().length > 0 ? Number(originalPrice) : undefined;

      const body: SubmitProductEditSuggestionRequest = {
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
        images: imgResult.images,
      };

      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      await contentApiClient.submitProductEditSuggestion(productId, body, {
        idempotencyKey,
      });

      reset();
      setPendingEditSubmissionThankYou();
      router.back();
    } catch (err) {
      const msg = messageForEditSubmitError(err);
      if (err instanceof ApiError && err.status === 404) {
        Alert.alert("Product unavailable", msg, [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }
      Alert.alert("Could not submit", msg, [{ text: "OK" }]);
    } finally {
      setSubmitting(false);
    }
  }, [
    isValid,
    submitting,
    initialFormSnapshot,
    initialBrandId,
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
    productId,
    reset,
    router,
  ]);

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
      priceType === "tbd" ||
      priceType === "na" ||
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
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: topPad, height: headerHeight }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.headerButton}>
            <Ionicons name="chevron-back-outline" size={24} color="#111827" />
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            hitSlop={8}
            style={[
              styles.headerButton,
              !canSubmit && !submitting && styles.headerButtonDisabled,
            ]}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Text
                style={[
                  styles.headerButtonText,
                  !canSubmit && styles.headerButtonTextDisabled,
                ]}
              >
                Submit Edit
              </Text>
            )}
          </Pressable>
        </View>
        <View style={styles.flowBarContainer}>
          <View style={[styles.flowBarFill, { width: `${(filledCount / 8) * 100}%` }]} />
        </View>
      </View>

      <ProductFormBody footerSpacerHeight={64 + footerSafePad} />

      <SafeAreaView style={[styles.footer, { paddingBottom: footerSafePad }]} edges={[]}>
        <Pressable
          onPress={handleSubmit}
          style={[
            styles.addButton,
            !canSubmit && !submitting && styles.addButtonDisabled,
          ]}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.addButtonText, !canSubmit && styles.addButtonTextDisabled]}>
              Submit Edit
            </Text>
          )}
        </Pressable>
      </SafeAreaView>

      <Modal visible={showDiscardConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Discard changes?</Text>
            <Text style={styles.confirmMessage}>
              You have unsaved changes. Are you sure you want to discard them?
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable
                onPress={() => setShowDiscardConfirm(false)}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDiscard}
                style={[styles.confirmButton, styles.confirmButtonDanger]}
              >
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
    backgroundColor: "white",
  },
  header: {
    flexDirection: "column",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
  },
  flowBarContainer: {
    height: 8,
    width: "100%",
    marginTop: 0,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  flowBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 4,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonText: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "600",
  },
  headerButtonTextDisabled: {
    color: "#9ca3af",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "white",
  },
  addButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  addButtonTextDisabled: {
    color: "#9ca3af",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  confirmModal: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmButtonDanger: {
    backgroundColor: "#fef2f2",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  confirmButtonTextDanger: {
    color: "#dc2626",
  },
});

export default function ProductEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [product, setProduct] = React.useState<Product | null>(null);

  React.useEffect(() => {
    if (!id) {
      setLoadError("Missing product");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const handed = takeProductForEditIfMatch(id);
      if (handed) {
        if (!cancelled) {
          setProduct(handed);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await contentApiClient.getProduct(id);
        const raw = (res as { product?: unknown })?.product;
        if (!raw) throw new Error("Product not found");
        const normalized = normalizeProduct(raw);
        if (!cancelled) {
          setProduct(normalized);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setProduct(null);
          setLoadError("Couldn't load this product");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 24 }}>Invalid link.</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (loadError || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 16, marginBottom: 16 }}>{loadError ?? "Unknown error"}</Text>
          <Pressable onPress={() => router.back()} style={styles.addButton}>
            <Text style={styles.addButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <EditProductContent productId={id} initialProduct={product} />;
}
