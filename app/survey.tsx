// app/survey.tsx
export const options = {
  headerShown: false,
};

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

const bgPattern = require('../assets/images/login-bg.png');

import { useAuth } from '@/src/context/AuthContext';
import { userClient } from '@/src/services/apiClients';

const questions = [
  {
    id: 'style',
    question: 'What style(s) are you into?',
    options: ['Masculine', 'Feminine', 'Gender-Neutral'],
  },
  {
    id: 'categories',
    question: 'What product categories would you like to explore?',
    options: [
      'Clothing',
      'Skincare',
      'Makeup',
      'Jewelry',
      'Tech/Gadgets',
      'Home Decor',
      'Fitness Gear',
      'Sustainable Products',
      'Budget Finds',
    ],
  },
  {
    id: 'budget',
    question: 'What’s your typical budget(s) for products?',
    options: [
      'Budget-Friendly ($0–$50)',
      'Mid-Range ($50–$150)',
      'Premium ($150–$500)',
      'Luxury ($500+)',
    ],
  },
  {
    id: 'brands',
    question: 'Do you prefer specific brands and/or discovering new ones?',
    options: ['Stick to Favorites', 'Love New Brands'],
  },
  {
    id: 'discovery',
    question: 'What is your preferred method(s) to discover new products?',
    options: ['Direct Product Listings', 'Pictures and Videos Featuring Products'],
  },
];

export default function Survey() {
  // -1 = intro screen, then 0..n for questions
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [responses, setResponses] = useState<any>({});
  const [customInputs, setCustomInputs] = useState<any>({});
  const router = useRouter();

  const { auth } = useAuth();
  const userId = auth?.user?.uid ?? 'u_demo';

  const question = (questions as any)[currentIndex] || ({} as any);
  const selected: string[] = (responses[question.id] as string[]) || [];

  const toggleOption = (option: string) => {
    const current: string[] = (responses[question.id] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    setResponses((prev: any) => ({ ...prev, [question.id]: updated }));
  };

  const handleAddCustomInput = () => {
    const current: string[] = (customInputs[question.id] as string[]) || [];
    setCustomInputs((prev: any) => ({
      ...prev,
      [question.id]: [...current, ''],
    }));
  };

  const handleRemoveCustomInput = (indexToRemove: number) => {
    const inputs = [...(((customInputs[question.id] as string[]) || []))];
    inputs.splice(indexToRemove, 1);
    setCustomInputs((prev: any) => ({
      ...prev,
      [question.id]: inputs,
    }));
  };

  const handleCustomInputChange = (text: string, index: number) => {
    const inputs = [...(((customInputs[question.id] as string[]) || []))];
    inputs[index] = text;
    setCustomInputs((prev: any) => ({
      ...prev,
      [question.id]: inputs,
    }));
  };

  const handleNext = async () => {
    // Merge custom inputs for the current question into responses
    const finalResponses = {
      ...responses,
      [question.id]: [
        ...(((responses[question.id] as string[]) || [])),
        ...((((customInputs[question.id] as string[]) || []).filter(Boolean))),
      ],
    };
    setResponses(finalResponses);

    const isLastQuestion = currentIndex === questions.length - 1;

    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    // Last question -> save to API, then route to tabs
    try {
      if (userId) {
        // Store survey under a `survey` field on the user profile
        // (Cast keeps TS happy if your SetUserPayload doesn't include `survey` yet)
        await userClient.setUser(userId, { survey: finalResponses } as any);
        // Optional: console.log('Survey saved via API');
      }
    } catch (err) {
      console.warn('Failed to save survey responses via API:', err);
      // You could show a toast here if you want
    } finally {
      router.replace('../(tabs)');
    }
  };

  const handleBack = () => {
    if (currentIndex === 0) {
      setCurrentIndex(-1);
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

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
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>

          {currentIndex === -1 ? (
            <View style={styles.introContent}>
              <Text style={styles.title}>Let's Personalize Your Experience!</Text>
              <Text style={styles.subtitle}>
                This short quiz helps tailor your "For You" page.
              </Text>

              <View style={styles.bottomButtons}>
                <TouchableOpacity
                  style={styles.buttonFullWidth}
                  onPress={() => setCurrentIndex(0)}
                >
                  <Text style={styles.buttonText}>Start Survey</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => router.replace('../(tabs)')}>
                <Text style={styles.skip}>Skip Survey</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.question}>{question.question}</Text>

                {question.options?.map((option: string, i: number) => (
                  <TouchableOpacity key={i} onPress={() => toggleOption(option)}>
                    <View
                      style={[
                        styles.option,
                        selected.includes(option) && styles.optionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected.includes(option) && styles.optionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {(customInputs[question.id] as string[] | undefined)?.map(
                  (text: string, index: number) => (
                    <View
                      key={index}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <TextInput
                        style={[styles.inputBox, { flex: 1 }]}
                        value={text}
                        onChangeText={(t) => handleCustomInputChange(t, index)}
                        placeholder="Type your answer..."
                      />
                      <TouchableOpacity onPress={() => handleRemoveCustomInput(index)}>
                        <Text style={{ color: 'red', marginLeft: 10 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )
                )}

                <TouchableOpacity onPress={handleAddCustomInput}>
                  <Text style={styles.addCustom}>+ Add Your Own</Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.bottomButtons}>
                <TouchableOpacity onPress={handleBack}>
                  <Text style={styles.skip}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleNext}
                >
                  <Text style={styles.buttonText}>
                    {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 150, // leave space for fixed buttons
    flexGrow: 1,
  },
  introContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  progressBarContainer: {
    height: 8,
    backgroundColor: '#eee',
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#000',
  },

  option: {
    backgroundColor: '#eee',
    padding: 12,
    marginVertical: 6,
    borderRadius: 6,
  },
  optionSelected: {
    backgroundColor: '#000',
  },
  optionText: {
    color: '#000',
  },
  optionTextSelected: {
    color: '#fff',
  },

  inputBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
  },
  addCustom: {
    color: '#007AFF',
    marginTop: 10,
    fontWeight: '600',
  },

  skip: {
    color: '#888',
    textDecorationLine: 'underline',
    marginRight: 20,
    marginTop: 16,
  },

  button: {
    backgroundColor: '#000',
    padding: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonFullWidth: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
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
});
