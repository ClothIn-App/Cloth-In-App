import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProductMatchCandidate } from '@/src/services/endpoints/content/productMatchCheck';
import type { ProductCreationSourceFlow } from '@/src/create/product/productCreationFlowTypes';
import { ProductDetailSheet } from '@/src/components/product/ProductDetailSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  candidates: ProductMatchCandidate[];
  sourceFlow: ProductCreationSourceFlow;
  onConfirm: (candidate: ProductMatchCandidate) => void;
  onConfirmEdit: (candidate: ProductMatchCandidate) => void;
  onAllRejected: () => void;
};

function getCopy(sourceFlow: ProductCreationSourceFlow) {
  if (sourceFlow === 'fitpic') {
    return {
      heading: 'Is this already in the catalog?',
      subheading: 'We found some existing matches. Select one or continue with a new entry.',
      confirmLabel: 'Yes, use this one',
      confirmEditLabel: 'Yes, edit & use',
      declineLabel: 'Not this one',
      continueNewLabel: 'None of these — add new',
    };
  }
  return {
    heading: 'This product may already exist',
    subheading: 'We found some close matches. Pick one or continue adding a new product.',
    confirmLabel: 'Yes, this is it',
    confirmEditLabel: 'Yes, edit & use',
    declineLabel: 'Not this one',
    continueNewLabel: 'None of these — add new',
  };
}

export function ProductMatchInterrupt({
  candidates,
  sourceFlow,
  onConfirm,
  onConfirmEdit,
  onAllRejected,
}: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);

  const copy = getCopy(sourceFlow);

  const visibleCandidates = candidates.filter((c) => !rejectedIds.has(c.productId));

  // Scroll to first non-rejected card when rejection shifts the list
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(Math.min(idx, visibleCandidates.length - 1));
  };

  const handleDecline = (candidate: ProductMatchCandidate) => {
    const next = new Set(rejectedIds);
    next.add(candidate.productId);
    if (next.size === candidates.length) {
      onAllRejected();
      return;
    }
    setRejectedIds(next);
    // Snap to next card if available, else previous
    const currentVisible = candidates.filter((c) => !next.has(c.productId));
    const snapIdx = Math.min(activeIndex, currentVisible.length - 1);
    setActiveIndex(snapIdx);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: snapIdx * SCREEN_WIDTH, animated: true });
    }, 0);
  };

  return (
    <Modal visible animationType="slide" transparent={false} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>{copy.heading}</Text>
          <Text style={styles.subheading}>{copy.subheading}</Text>
        </View>

        {/* Dot indicators */}
        {visibleCandidates.length > 1 && (
          <View style={styles.dotsRow}>
            {visibleCandidates.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}

        {/* Card count label */}
        <Text style={styles.countLabel}>
          {activeIndex + 1} of {visibleCandidates.length}
        </Text>

        {/* Swiper */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.swiper}
          contentContainerStyle={styles.swiperContent}
        >
          {visibleCandidates.map((candidate) => (
            <MatchCard
              key={candidate.productId}
              candidate={candidate}
              copy={copy}
              onConfirm={() => onConfirm(candidate)}
              onConfirmEdit={() => onConfirmEdit(candidate)}
              onDecline={() => handleDecline(candidate)}
              onViewProduct={() => setViewingProductId(candidate.productId)}
            />
          ))}
        </ScrollView>

        {/* All rejected shortcut */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable onPress={onAllRejected} style={styles.continueNewButton}>
            <Text style={styles.continueNewText}>{copy.continueNewLabel}</Text>
          </Pressable>
        </View>
      </View>

      {/* Product detail overlay — rendered on top of this modal when user taps a card image */}
      {viewingProductId != null && (
        <ProductDetailSheet
          productId={viewingProductId}
          onClose={() => setViewingProductId(null)}
        />
      )}
    </Modal>
  );
}

type CardCopy = ReturnType<typeof getCopy>;

type MatchCardProps = {
  candidate: ProductMatchCandidate;
  copy: CardCopy;
  onConfirm: () => void;
  onConfirmEdit: () => void;
  onDecline: () => void;
  onViewProduct?: () => void;
};

function MatchCard({ candidate, copy, onConfirm, onConfirmEdit, onDecline, onViewProduct }: MatchCardProps) {
  const { preview } = candidate;

  return (
    <View style={styles.card}>
      {/* Preview image — tappable to open full product detail */}
      <Pressable style={styles.imageContainer} onPress={onViewProduct} accessibilityLabel={`View details for ${preview.name}`}>
        {preview.imageUrl ? (
          <Image
            source={{ uri: preview.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel={`${preview.name} preview image`}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>No image</Text>
          </View>
        )}
      </Pressable>
      <Text style={styles.tapHint}>Tap to view details</Text>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={onConfirm}
          accessibilityLabel={copy.confirmLabel}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
            {copy.confirmLabel}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={onConfirmEdit}
          accessibilityLabel={copy.confirmEditLabel}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
            {copy.confirmEditLabel}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.actionButtonDecline]}
          onPress={onDecline}
          accessibilityLabel={copy.declineLabel}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextDecline]}>
            {copy.declineLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    backgroundColor: '#3b82f6',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  countLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  swiper: {
    flex: 1,
  },
  swiperContent: {
    alignItems: 'flex-start',
  },
  card: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 6,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1 / 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginBottom: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  tapHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 12,
  },
  actions: {
    gap: 8,
  },
  actionButton: {
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  actionButtonSecondary: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionButtonDecline: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    color: 'white',
  },
  actionButtonTextSecondary: {
    color: '#2563eb',
  },
  actionButtonTextDecline: {
    color: '#374151',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueNewButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueNewText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});
