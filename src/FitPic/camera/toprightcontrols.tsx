// app/src/fitpic/toprightcontrols.tsx
import * as React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView as IconSymbol } from 'expo-symbols';
import { router } from 'expo-router';

type CameraControllerLike = {
  flashOn?: boolean;
  flashMode?: 'off' | 'on' | 'auto' | 'torch';
  facing: 'back' | 'front';
  toggleFlash: () => void;
  flip: () => void;
};

type Props = {
  controller: CameraControllerLike;
  /** Pass your current photos length here */
  photoCount?: number; // ← required for enabling Next (defaults to 0 if omitted)
  /** Optional legacy prop; only used if photoCount is undefined */
  canProceed?: boolean;
  style?: any;
  /** If you want a different route, change this prop or the default below */
  nextRoute?: string;
};

export default function TopRightControls({
  controller,
  photoCount = 0,
  canProceed,
  style,
  nextRoute = '/postpic', // ← change this if your file lives elsewhere (e.g. '/modals/postpic')
}: Props) {
  const { top, right } = useSafeAreaInsets();

  // Prefer photoCount if present; else fall back to canProceed
  const canGoNext =
    typeof photoCount === 'number' ? photoCount >= 1 : !!canProceed;

  const isFlashOn =
    controller.flashOn ??
    (controller.flashMode ? controller.flashMode !== 'off' : false);

  const flashSymbol = isFlashOn ? 'bolt.fill' : 'bolt';

  const onPressNext = React.useCallback(() => {
    if (!canGoNext) return;
    router.push(nextRoute);
  }, [canGoNext, nextRoute]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.absolute, { top: top + 8, right: Math.max(right, 8) }, style]}
    >
      <View pointerEvents="auto" style={styles.column}>
        {/* NEXT */}
        <Pressable
          onPress={onPressNext}
          disabled={!canGoNext}
          accessibilityRole="button"
          accessibilityLabel="Next"
          style={({ pressed }) => [
            styles.nextBase,
            canGoNext ? styles.nextEnabled : styles.nextDisabled,
            pressed && canGoNext && styles.nextPressed,
          ]}
        >
          <Text style={styles.nextTxt}>Next</Text>
        </Pressable>

        {/* FLASH (no bubble) */}
        <IconButton
          testID="btn-flash"
          sf={flashSymbol}
          active={isFlashOn}
          label={isFlashOn ? 'Flash on' : 'Flash off'}
          onPress={controller.toggleFlash}
        />

        {/* FLIP (no bubble) */}
        <IconButton
          testID="btn-flip"
          sf="camera.rotate"
          active
          label={controller.facing === 'front' ? 'Front camera' : 'Back camera'}
          onPress={controller.flip}
        />
      </View>
    </View>
  );
}

type IconButtonProps = {
  sf: string;
  onPress: () => void;
  active?: boolean;
  label: string;
  testID?: string;
};

function IconButton({ sf, onPress, active, label, testID }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
      style={({ pressed }) => [
        styles.iconPressable,
        pressed && styles.iconPressed,
      ]}
    >
      <IconSymbol
        key={sf}
        name={sf as any}
        size={22}
        // Still no bubble — just tint
        tintColor={active ? '#FFF' : 'rgba(255,255,255,0.85)'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute', zIndex: 20 },
  column: { flexDirection: 'column', gap: 10, alignItems: 'flex-end' },

  // NEXT styles
  nextBase: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nextEnabled: {
    backgroundColor: '#000', // ← solid black bubble when 1+ photo
  },
  nextDisabled: {
    backgroundColor: 'rgba(0,0,0,0.55)', // greyed/disabled
    opacity: 0.65,
  },
  nextPressed: { opacity: 0.9 },
  nextTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Icon buttons: no bubbles
  iconPressable: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPressed: { opacity: 0.85 },
});
