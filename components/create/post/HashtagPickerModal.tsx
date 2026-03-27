import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { searchHashtags, getTrendingHashtags } from '../../../src/services/searchApi';
import type { HashtagSearchResult } from '../../../src/types/search';

const MAX_TAGS = 6;
const DEBOUNCE_MS = 300;

// Chip "weight" for visual size variation: higher postCount = slightly larger
function chipScale(postCount: number): 'sm' | 'md' | 'lg' {
  if (postCount >= 4) return 'lg';
  if (postCount >= 2) return 'md';
  return 'sm';
}

type Props = {
  visible: boolean;
  onClose: () => void;
  initialSelectedTags?: string[];
  onApply: (selectedTags: string[]) => void;
};

export default function HashtagPickerModal({
  visible,
  onClose,
  initialSelectedTags = [],
  onApply,
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    () => new Set(initialSelectedTags.map(t => t.replace(/^#/, '').toLowerCase()))
  );
  const [searchResults, setSearchResults] = useState<HashtagSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [trendingChips, setTrendingChips] = useState<HashtagSearchResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef('');
  const inputRef = useRef<TextInput>(null);

  const canonicalQuery = query
    .trim()
    .replace(/^#/, '')
    .toLowerCase()
    // Keep in sync with our extraction regex /#(\w+)/.
    .replace(/[^a-z0-9_]/g, '');

  // Reset state and fetch trending each time the modal opens
  useEffect(() => {
    if (visible) {
      setQuery('');
      setSearchResults([]);
      setSearching(false);
      setSelectedTags(
        new Set(initialSelectedTags.map(t => t.replace(/^#/, '').toLowerCase()))
      );
      // Fetch trending tags from the backend (or mock)
      getTrendingHashtags()
        .then(items => setTrendingChips(items ?? []))
        .catch(() => setTrendingChips([]));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Debounced hashtag search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      lastQueryRef.current = trimmed;
      try {
        const res = await searchHashtags(trimmed, {}, 'relevance', null);
        if (lastQueryRef.current === trimmed) {
          setSearchResults(res.items ?? []);
        }
      } catch {
        if (lastQueryRef.current === trimmed) setSearchResults([]);
      } finally {
        if (lastQueryRef.current === trimmed) setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const toggleTag = useCallback((tag: string) => {
    const canonical = tag.toLowerCase();
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(canonical)) {
        next.delete(canonical);
      } else if (next.size < MAX_TAGS) {
        next.add(canonical);
      }
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    Keyboard.dismiss();
    onApply(Array.from(selectedTags));
  }, [selectedTags, onApply]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const canApply = selectedTags.size > 0;
  const isSearching = query.trim().length > 0;

  type ChipItem = HashtagSearchResult & { isCustom?: boolean };

  const resultsAsItems: ChipItem[] = searchResults as ChipItem[];
  const queryExistsInResults = resultsAsItems.some(r => r.tag.toLowerCase() === canonicalQuery);
  const showAddCustomChip =
    isSearching && canonicalQuery.length > 0 && !searching && !queryExistsInResults;

  const addCustomChip: ChipItem | null = showAddCustomChip
    ? { tag: canonicalQuery, postCount: 1, isCustom: true }
    : null;

  const chipsToShow: ChipItem[] = isSearching
    ? [...resultsAsItems, ...(addCustomChip ? [addCustomChip] : [])]
    : trendingChips;
  const sectionLabel = isSearching ? 'Results' : 'Trending';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleClose} hitSlop={10} style={styles.headerSide}>
              <Text style={styles.headerCancel}>Cancel</Text>
            </Pressable>

            <Text style={styles.headerTitle}>Tags</Text>

            <Pressable
              onPress={handleApply}
              hitSlop={10}
              style={styles.headerSide}
              disabled={!canApply}
            >
              <Text style={[styles.headerApply, !canApply && styles.headerApplyDisabled]}>
                Apply
              </Text>
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={styles.searchRow}>
            <Text style={styles.hashPrefix}>#</Text>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search tags…"
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searching && <ActivityIndicator size="small" color="#6b7280" style={{ marginLeft: 8 }} />}
            {query.length > 0 && !searching && (
              <Pressable onPress={() => setQuery('')} hitSlop={8} style={{ marginLeft: 8 }}>
                <Text style={styles.clearBtn}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Selected tags strip */}
          {selectedTags.size > 0 && (
            <View style={styles.selectedStrip}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedScroll}>
                {Array.from(selectedTags).map(tag => (
                  <Pressable key={tag} onPress={() => toggleTag(tag)} style={styles.selectedPill}>
                    <Text style={styles.selectedPillText}>#{tag} ✕</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.tagCount}>{selectedTags.size}/{MAX_TAGS}</Text>
            </View>
          )}

          {/* Section label */}
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>{sectionLabel}</Text>
          </View>

          {/* Chip grid */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.chipGrid}
            keyboardShouldPersistTaps="handled"
          >
            {isSearching && !searching && chipsToShow.length === 0 && (
              <Text style={styles.emptyText}>No tags found for "#{query}"</Text>
            )}

            {chipsToShow.map(item => {
              const isSelected = selectedTags.has(item.tag);
              const isAtMax = selectedTags.size >= MAX_TAGS;
              const scale = chipScale(item.postCount);
              return (
                <Pressable
                  key={item.tag}
                  onPress={() => toggleTag(item.tag)}
                  disabled={!isSelected && isAtMax}
                  style={[
                    styles.chip,
                    scale === 'lg' && styles.chipLg,
                    scale === 'sm' && styles.chipSm,
                    isSelected && styles.chipSelected,
                    !isSelected && isAtMax && styles.chipDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      scale === 'lg' && styles.chipTextLg,
                      scale === 'sm' && styles.chipTextSm,
                      isSelected && styles.chipTextSelected,
                      !isSelected && isAtMax && styles.chipTextDisabled,
                    ]}
                  >
                    {item.isCustom ? `+ #${item.tag}` : `#${item.tag}`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedTags.size >= MAX_TAGS && (
            <View style={styles.maxBanner}>
              <Text style={styles.maxBannerText}>Max {MAX_TAGS} hashtags selected</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerSide: { minWidth: 64 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center', flex: 1 },
  headerCancel: { fontSize: 15, color: '#6b7280' },
  headerApply: { fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'right' },
  headerApplyDisabled: { color: '#d1d5db' },

  // Search bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  hashPrefix: { fontSize: 16, fontWeight: '700', color: '#111827', marginRight: 4 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', padding: 0 },
  clearBtn: { fontSize: 13, color: '#9ca3af' },

  // Selected strip
  selectedStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
  },
  selectedScroll: { gap: 8, paddingRight: 8 },
  selectedPill: {
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectedPillText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  tagCount: { fontSize: 12, color: '#9ca3af', marginLeft: 6, flexShrink: 0 },

  // Section label
  sectionLabelRow: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Chip grid
  scroll: { flex: 1 },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },

  // Chips – base (md)
  chip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipSm: { paddingHorizontal: 11, paddingVertical: 6 },
  chipLg: { paddingHorizontal: 18, paddingVertical: 10 },
  chipSelected: { backgroundColor: '#111827', borderColor: '#111827' },
  chipDisabled: { opacity: 0.38 },
  chipText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  chipTextSm: { fontSize: 13 },
  chipTextLg: { fontSize: 15 },
  chipTextSelected: { color: '#ffffff' },
  chipTextDisabled: { color: '#6b7280' },

  // Empty / max states
  emptyText: { color: '#9ca3af', fontSize: 14, marginTop: 20, textAlign: 'center', width: '100%' },
  maxBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  maxBannerText: { fontSize: 13, color: '#92400e', textAlign: 'center' },
});
