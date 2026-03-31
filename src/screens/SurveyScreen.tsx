// src/screens/SurveyScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  ONBOARDING_QUESTIONS,
  type OnboardingQuestionId,
} from '@/src/features/onboarding/questions';
import {
  SURVEY_BRAND_TEXT_MAX_CHARS,
  type OnboardingAnswers,
  type RecommendedBrand,
} from '@/src/features/onboarding/types';
import type { BrandSearchHit } from '@/src/services/apiClients/contentClient';
import { contentApiClient } from '@/src/services/apiClients/contentClient';

const BRAND_SEARCH_DEBOUNCE_MS = 280;

const bgPattern = require('@/assets/images/login-bg.png');

const TOTAL_STEPS = 6;

type Props = {
  onSkip: () => void;
  onSubmit: (answers: OnboardingAnswers) => Promise<void> | void;
  onFetchBrands: (answers: Partial<OnboardingAnswers>) => Promise<RecommendedBrand[]>;
};

type AnswerMap = Record<OnboardingQuestionId, string[]>;

const emptyAnswers = (): AnswerMap => ({
  styleIdentity: [],
  styleVibes: [],
  categories: [],
  occasions: [],
  priceTiers: [],
});

export default function SurveyScreen({ onSkip, onSubmit, onFetchBrands }: Props) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [answers, setAnswers] = useState<AnswerMap>(emptyAnswers());

  // Q6 state
  const [recommendedBrands, setRecommendedBrands] = useState<RecommendedBrand[]>([]);
  const [trendingBrands, setTrendingBrands] = useState<RecommendedBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  /** Suggested / Trending lane only — not shown under Your picks. */
  const [laneSelectedBrandIds, setLaneSelectedBrandIds] = useState<string[]>([]);
  /** Brands chosen from search results — shown under Your picks. */
  const [searchSelectedBrandIds, setSearchSelectedBrandIds] = useState<string[]>([]);
  const [typedBrandNames, setTypedBrandNames] = useState<string[]>([]);
  const [brandLabelById, setBrandLabelById] = useState<Record<string, string>>({});
  const [brandDraft, setBrandDraft] = useState<string>('');
  const [searchHits, setSearchHits] = useState<BrandSearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isBrandsScreen = currentIndex === ONBOARDING_QUESTIONS.length;
  const currentQuestion = !isBrandsScreen ? ONBOARDING_QUESTIONS[currentIndex] : null;
  const progress = currentIndex < 0 ? 0 : ((currentIndex + 1) / TOTAL_STEPS) * 100;

  useEffect(() => {
    if (isBrandsScreen) {
      fetchBrands();
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!isBrandsScreen) {
      setSearchHits([]);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const q = brandDraft.trim();
    if (q.length < 1) {
      setSearchHits([]);
      setSearchLoading(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      void (async () => {
        setSearchLoading(true);
        try {
          const res = await contentApiClient.searchBrands({ q, limit: 20 });
          setSearchHits(res.brands ?? []);
        } catch {
          setSearchHits([]);
        } finally {
          setSearchLoading(false);
        }
      })();
    }, BRAND_SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [brandDraft, isBrandsScreen]);

  const fetchBrands = async () => {
    setBrandsLoading(true);
    setTrendingError(null);
    try {
      const answersSlice = {
        styleIdentity: answers.styleIdentity,
        styleVibes: answers.styleVibes,
        categories: answers.categories,
        occasions: answers.occasions,
        priceTiers: answers.priceTiers,
      };
      const [recommended, trendingRes] = await Promise.all([
        onFetchBrands(answersSlice),
        contentApiClient.getTrendingBrands({ limit: 24 }).catch(() => null),
      ]);
      setRecommendedBrands(recommended);
      if (trendingRes?.brands?.length) {
        setTrendingBrands(
          trendingRes.brands.map((b) => ({
            brandId: b.brandId,
            name: b.name,
            score: 0,
          }))
        );
      } else {
        setTrendingBrands([]);
        if (trendingRes === null) {
          setTrendingError('Trending brands could not be loaded.');
        }
      }
    } finally {
      setBrandsLoading(false);
    }
  };

  const toggleOption = (questionId: OnboardingQuestionId, value: string) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      return {
        ...prev,
        [questionId]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  const toggleLaneBrand = (brandId: string, displayName?: string) => {
    setLaneSelectedBrandIds((prev) => {
      if (prev.includes(brandId)) {
        return prev.filter((id) => id !== brandId);
      }
      return [...prev, brandId];
    });
    if (displayName) {
      setBrandLabelById((prev) => ({ ...prev, [brandId]: displayName }));
    }
  };

  const removeSearchPick = (brandId: string) => {
    setSearchSelectedBrandIds((prev) => prev.filter((id) => id !== brandId));
  };

  const labelForBrandId = (id: string) => {
    const fromLane =
      recommendedBrands.find((b) => b.brandId === id) ||
      trendingBrands.find((b) => b.brandId === id);
    if (fromLane) return fromLane.name;
    return brandLabelById[id] ?? id;
  };

  const pickSearchBrand = (hit: BrandSearchHit) => {
    setSearchSelectedBrandIds((prev) =>
      prev.includes(hit.brandId) ? prev : [...prev, hit.brandId]
    );
    setBrandLabelById((prev) => ({ ...prev, [hit.brandId]: hit.name }));
    setBrandDraft('');
    setSearchHits([]);
  };

  const addTypedBrandFromDraft = () => {
    const trimmed = brandDraft.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    setTypedBrandNames((prev) => {
      if (prev.some((p) => p.toLowerCase() === lower)) return prev;
      return [...prev, trimmed];
    });
    setBrandDraft('');
    setSearchHits([]);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentIndex === 0) {
      setCurrentIndex(-1);
    } else {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    const mergedBrandIds = [
      ...new Set([...laneSelectedBrandIds, ...searchSelectedBrandIds]),
    ];
    const finalAnswers: OnboardingAnswers = {
      styleIdentity: answers.styleIdentity,
      styleVibes: answers.styleVibes,
      categories: answers.categories,
      occasions: answers.occasions,
      priceTiers: answers.priceTiers,
      selectedBrandIds: mergedBrandIds,
      typedBrandNames,
    };
    await Promise.resolve(onSubmit(finalAnswers));
  };

  if (currentIndex === -1) {
    return (
      <ImageBackground
        source={bgPattern}
        resizeMode="repeat"
        style={styles.background}
        imageStyle={{ opacity: 0.03 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.introContent}>
            <Text style={styles.introTitle}>Let's build your style profile.</Text>
            <Text style={styles.introSubtitle}>
              6 quick questions. Takes about 30 seconds. We'll use your answers to personalise
              everything.
            </Text>
            <TouchableOpacity style={styles.buttonFull} onPress={() => setCurrentIndex(0)}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSkip} style={styles.skipRow}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (isBrandsScreen) {
    return (
      <ImageBackground
        source={bgPattern}
        resizeMode="repeat"
        style={styles.background}
        imageStyle={{ opacity: 0.03 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ProgressBar progress={progress} step={TOTAL_STEPS} total={TOTAL_STEPS} />
            <ScrollView contentContainerStyle={styles.scroll}>
              <Text style={styles.question}>
                {recommendedBrands.length > 0 || trendingBrands.length > 0
                  ? "Here are some brands we think you'll love."
                  : 'Any brands you love — or want to explore?'}
              </Text>
              <Text style={styles.subheading}>
                Tap to select. You can also search by brand name.
              </Text>

              {brandsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#000" />
                  <Text style={styles.loadingText}>Finding your matches…</Text>
                </View>
              ) : (
                <>
                  {recommendedBrands.length > 0 ? (
                    <>
                      <Text style={styles.laneLabel}>Suggested for you</Text>
                      <View style={styles.chipWrap}>
                        {recommendedBrands.map((brand) => {
                          const isSelected = laneSelectedBrandIds.includes(brand.brandId);
                          return (
                            <TouchableOpacity
                              key={brand.brandId}
                              style={[styles.chip, isSelected && styles.chipSelected]}
                              onPress={() => toggleLaneBrand(brand.brandId, brand.name)}
                            >
                              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                {brand.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  ) : null}
                  {trendingBrands.length > 0 ? (
                    <>
                      <Text style={styles.laneLabel}>Trending</Text>
                      <View style={styles.chipWrap}>
                        {trendingBrands.map((brand) => {
                          const isSelected = laneSelectedBrandIds.includes(brand.brandId);
                          return (
                            <TouchableOpacity
                              key={`trending-${brand.brandId}`}
                              style={[styles.chip, isSelected && styles.chipSelected]}
                              onPress={() => toggleLaneBrand(brand.brandId, brand.name)}
                            >
                              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                {brand.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  ) : null}
                  {trendingError ? <Text style={styles.trendingErrorText}>{trendingError}</Text> : null}
                  {!brandsLoading &&
                  recommendedBrands.length === 0 &&
                  trendingBrands.length === 0 &&
                  !trendingError ? (
                    <Text style={styles.emptyBrandsHint}>
                      No suggestions yet — add brands below or finish to continue.
                    </Text>
                  ) : null}
                </>
              )}

              {searchSelectedBrandIds.length > 0 || typedBrandNames.length > 0 ? (
                <>
                  <Text style={styles.laneLabel}>Your picks</Text>
                  <View style={styles.chipWrap}>
                    {searchSelectedBrandIds.map((id) => (
                      <TouchableOpacity
                        key={`pick-${id}`}
                        style={[styles.chip, styles.chipSelected]}
                        onPress={() => removeSearchPick(id)}
                      >
                        <Text style={[styles.chipText, styles.chipTextSelected]}>
                          {labelForBrandId(id)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {typedBrandNames.map((name) => (
                      <TouchableOpacity
                        key={`typed-${name}`}
                        style={[styles.chip, styles.typedChip]}
                        onPress={() =>
                          setTypedBrandNames((prev) => prev.filter((n) => n !== name))
                        }
                      >
                        <Text style={styles.typedChipText}>{name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}

              <Text style={styles.laneLabel}>Search / add your own</Text>
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  value={brandDraft}
                  onChangeText={(t) => {
                    if (t.length <= SURVEY_BRAND_TEXT_MAX_CHARS) {
                      setBrandDraft(t);
                    }
                  }}
                  placeholder="Search for a brand…"
                  placeholderTextColor="#aaa"
                  returnKeyType="done"
                  maxLength={SURVEY_BRAND_TEXT_MAX_CHARS}
                  onSubmitEditing={addTypedBrandFromDraft}
                />
                {brandDraft.trim().length > 0 && (
                  <TouchableOpacity style={styles.addBtn} onPress={addTypedBrandFromDraft}>
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
              {brandDraft.trim().length > 0 ? (
                <View style={styles.suggestionsBox}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    style={styles.suggestionsScroll}
                  >
                    {searchLoading ? (
                      <ActivityIndicator style={styles.suggestionsLoader} color="#666" />
                    ) : null}
                    {(searchLoading ? [] : searchHits)
                      .filter(
                        (hit) =>
                          hit.name.trim().toLowerCase() !== brandDraft.trim().toLowerCase()
                      )
                      .map((hit) => (
                        <Pressable
                          key={hit.brandId}
                          style={({ pressed }) => [
                            styles.suggestionRow,
                            pressed && styles.suggestionRowPressed,
                          ]}
                          onPress={() => pickSearchBrand(hit)}
                        >
                          <Text style={styles.suggestionText}>{hit.name}</Text>
                        </Pressable>
                      ))}
                    <Pressable
                      style={({ pressed }) => [
                        styles.suggestionRow,
                        styles.useTypedRow,
                        pressed && styles.suggestionRowPressed,
                      ]}
                      onPress={addTypedBrandFromDraft}
                    >
                      <Text style={styles.suggestionText}>{brandDraft.trim()}</Text>
                    </Pressable>
                  </ScrollView>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.bottomButtons}>
              <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <View style={styles.rightButtons}>
                <TouchableOpacity onPress={onSkip} style={styles.skipBtnInline}>
                  <Text style={styles.skipInlineText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleFinish}>
                  <Text style={styles.buttonText}>Finish</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // Q1–Q5: fixed chip-only selection
  const question = currentQuestion!;
  const selected = answers[question.id] ?? [];

  return (
    <ImageBackground
      source={bgPattern}
      resizeMode="repeat"
      style={styles.background}
      imageStyle={{ opacity: 0.03 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ProgressBar progress={progress} step={currentIndex + 1} total={TOTAL_STEPS} />

          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.question}>{question.heading}</Text>
            {question.subheading && (
              <Text style={styles.subheading}>{question.subheading}</Text>
            )}
            <Text style={styles.selectHint}>Select all that apply</Text>

            <View style={styles.chipWrap}>
              {question.options.map((opt) => {
                const isSelected = selected.includes(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleOption(question.id, opt.value)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.bottomButtons}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

type ProgressBarProps = { progress: number; step: number; total: number };

function ProgressBar({ progress, step, total }: ProgressBarProps) {
  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
      </View>
      <Text style={styles.progressLabel}>
        {step} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  container: { flex: 1 },

  introContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  introTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
    lineHeight: 42,
  },
  introSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 36,
  },

  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#111',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 12,
    color: '#999',
    minWidth: 36,
    textAlign: 'right',
  },

  scroll: {
    padding: 20,
    paddingBottom: 160,
    flexGrow: 1,
  },

  question: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
    lineHeight: 30,
  },
  subheading: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  laneLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginTop: 4,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  trendingErrorText: {
    fontSize: 13,
    color: '#b45309',
    marginBottom: 8,
  },
  emptyBrandsHint: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    lineHeight: 20,
  },
  selectHint: {
    fontSize: 13,
    color: '#bbb',
    marginBottom: 18,
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 100,
    backgroundColor: '#F2F2F2',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  chipSelected: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },

  typedChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 100,
    backgroundColor: '#F8F8F8',
    borderWidth: 1.5,
    borderColor: '#C4C4C4',
    borderStyle: 'dashed',
  },
  typedChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  suggestionsBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    maxHeight: 220,
    overflow: 'hidden',
  },
  suggestionsScroll: {
    maxHeight: 220,
  },
  suggestionsLoader: {
    paddingVertical: 16,
  },
  suggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  suggestionRowPressed: {
    backgroundColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 15,
    color: '#111',
  },
  useTypedRow: {
    borderBottomWidth: 0,
  },

  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  customInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#FAFAFA',
  },
  addBtn: {
    backgroundColor: '#111',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#888',
  },

  bottomButtons: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    color: '#888',
    fontSize: 15,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skipBtnInline: {
    padding: 8,
  },
  skipInlineText: {
    color: '#888',
    fontSize: 15,
  },

  button: {
    backgroundColor: '#111',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonFull: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  skipRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  skipText: {
    color: '#999',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});

// Legacy export for backward compat
export type SurveyResponses = Record<string, string[]>;
