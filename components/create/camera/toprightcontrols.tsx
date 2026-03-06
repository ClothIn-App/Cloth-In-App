import * as React from 'react';
import { View, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView as IconSymbol } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useDrafts } from '../draftcontext';

type CameraControllerLike = {
  flashOn?: boolean;
  flashMode?: 'off' | 'on' | 'auto' | 'torch';
  facing: 'back' | 'front';
  toggleFlash: () => void;
  flip: () => void;
};

type Props = {
  controller: CameraControllerLike;
  style?: ViewStyle | ViewStyle[];
  /** If provided, called when user taps Next (preferred). */
  onNext?: () => void;
  /** When controls are inside the camera frame, use these instead of safe area. */
  insetsOverride?: { top?: number; right?: number };
};

export default function TopRightControls({ controller, style, onNext, insetsOverride }: Props) {
  const insets = useSafeAreaInsets();
  const top = insetsOverride?.top ?? insets.top;
  const right = insetsOverride?.right ?? insets.right;
  const router = useRouter();
  const { items, selectedIds } = useDrafts();

  const canGoNext =
    (selectedIds?.length ?? 0) > 0 || (items?.length ?? 0) > 0;

  const isFlashOn =
    controller.flashOn ??
    (controller.flashMode ? controller.flashMode !== 'off' : false);

  const flashSymbol = isFlashOn ? 'bolt.fill' : 'bolt';

  const onPressNext = React.useCallback(() => {
    if (!canGoNext) return;
    if (onNext) {
      onNext(); // let parent seed selection/order + navigate
    } else {
      router.push('/create-modals/fitpic_post'); // fallback
    }
  }, [canGoNext, onNext, router]);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.absolute,
        { top: top + 8, right: Math.max(right, 8) },
        style,
      ]}
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

        {/* FLASH */}
        <IconButton
          testID="btn-flash"
          sf={flashSymbol}
          active={isFlashOn}
          label={isFlashOn ? 'Flash on' : 'Flash off'}
          onPress={controller.toggleFlash}
        />

        {/* FLIP */}
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

function IconButton({
  sf,
  onPress,
  active,
  label,
  testID,
}: IconButtonProps) {
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
        tintColor={active ? '#FFF' : 'rgba(255,255,255,0.85)'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute', zIndex: 20 },
  column: { flexDirection: 'column', gap: 10, alignItems: 'flex-end' },
  nextBase: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  nextEnabled: { backgroundColor: '#000' },
  nextDisabled: { backgroundColor: 'rgba(0,0,0,0.55)', opacity: 0.65 },
  nextPressed: { opacity: 0.9 },
  nextTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  iconPressable: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPressed: { opacity: 0.85 },
});
