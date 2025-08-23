/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark  = '#fff';

export const Colors = {
  light: {
    // base
    text: '#11181C',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,

    // NEW tokens
    mutedText: '#666A70',
    card: '#F7F7F8',
    border: '#E3E3E7',
    pillActive: '#E1E1E6',
    pillInactive: '#F2F2F5',
  },
  dark: {
    // base
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,

    // NEW tokens (darker versions)
    mutedText: '#A0A6AD',
    card: '#1B1D1F',
    border: '#2A2E31',
    pillActive: '#34383C',
    pillInactive: '#24282B',
  },
};
