// src/screens/SurveyScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
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
import type { OnboardingAnswers, RecommendedBrand } from '@/src/features/onboarding/types';

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
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [brandDraft, setBrandDraft] = useState<string>('');
  const [brandDraftError, setBrandDraftError] = useState<string>('');

  const isBrandsScreen = currentIndex === ONBOARDING_QUESTIONS.length;
  const currentQuestion = !isBrandsScreen ? ONBOARDING_QUESTIONS[currentIndex] : null;
  const progress = currentIndex < 0 ? 0 : ((currentIndex + 1) / TOTAL_STEPS) * 100;

  useEffect(() => {
    if (isBrandsScreen) {
      fetchBrands();
    }
  }, [currentIndex]);

  const fetchBrands = async () => {
    setBrandsLoading(true);
    try {
      const brands = await onFetchBrands({
        styleIdentity: answers.styleIdentity,
        styleVibes: answers.styleVibes,
        categories: answers.categories,
        occasions: answers.occasions,
        priceTiers: answers.priceTiers,
      });
      setRecommendedBrands(brands);
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

  const toggleBrand = (brandId: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]
    );
  };

  /**
   * Try to resolve typed brand text to an existing brandId (case-insensitive).
   * If found, select it. If not, show a brief error.
   */
  const tryAddCustomBrand = () => {
    const trimmed = brandDraft.trim();
    if (!trimmed) return;

    const lowerInput = trimmed.toLowerCase();
    const match = recommendedBrands.find(
      (b) => b.brandId.toLowerCase() === lowerInput || b.name.toLowerCase() === lowerInput
    );

    if (match) {
      if (!selectedBrandIds.includes(match.brandId)) {
        setSelectedBrandIds((prev) => [...prev, match.brandId]);
      }
      setBrandDraft('');
      setBrandDraftError('');
    } else {
      setBrandDraftError("We couldn't find that brand. Try searching by exact name.");
    }
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
    const finalAnswers: OnboardingAnswers = {
      styleIdentity: answers.styleIdentity,
      styleVibes: answers.styleVibes,
      categories: answers.categories,
      occasions: answers.occasions,
      priceTiers: answers.priceTiers,
      selectedBrandIds,
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
                {recommendedBrands.length > 0
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
                <View style={styles.chipWrap}>
                  {recommendedBrands.map((brand) => {
                    const isSelected = selectedBrandIds.includes(brand.brandId);
                    return (
                      <TouchableOpacity
                        key={brand.brandId}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => toggleBrand(brand.brandId)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {brand.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.customInputRow}>
                <TextInput
                  style={[styles.customInput, brandDraftError ? styles.customInputError : null]}
                  value={brandDraft}
                  onChangeText={(t) => {
                    setBrandDraft(t);
                    if (brandDraftError) setBrandDraftError('');
                  }}
                  placeholder="Search for a brand…"
                  placeholderTextColor="#aaa"
                  returnKeyType="done"
                  onSubmitEditing={tryAddCustomBrand}
                />
                {brandDraft.trim().length > 0 && (
                  <TouchableOpacity style={styles.addBtn} onPress={tryAddCustomBrand}>
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
              {brandDraftError ? (
                <Text style={styles.errorText}>{brandDraftError}</Text>
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
  customInputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
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
