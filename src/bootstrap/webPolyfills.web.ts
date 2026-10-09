// src/bootstrap/webPolyfills.web.ts
// Fills gaps in react-native-web so the app runs in a browser.
//
// react-native-web does not implement Image.resolveAssetSource, which the mock
// data layer uses to turn require()'d images into { uri, width, height }.
// Recreate it from react-native-web's asset registry so bundled images resolve.
import { Alert, Image } from 'react-native';
// @ts-ignore - internal module without type declarations
import { getAssetByID } from 'react-native-web/dist/modules/AssetRegistry';

type ResolvedAssetSource = { uri: string; width?: number; height?: number; scale?: number };

function resolveAssetSource(source: any): ResolvedAssetSource | null {
  if (source == null) return null;
  if (typeof source === 'number') {
    const asset = getAssetByID(source);
    if (!asset) return null;
    const scale = asset.scales?.[0] ?? 1;
    const scaleSuffix = scale !== 1 ? `@${scale}x` : '';
    return {
      uri: `${asset.httpServerLocation}/${asset.name}${scaleSuffix}.${asset.type}`,
      width: asset.width,
      height: asset.height,
      scale,
    };
  }
  if (typeof source === 'string') return { uri: source };
  if (typeof source === 'object' && typeof source.uri === 'string') return source;
  return null;
}

const ImageWithStatics = Image as any;
if (typeof ImageWithStatics.resolveAssetSource !== 'function') {
  ImageWithStatics.resolveAssetSource = resolveAssetSource;
}

// react-native-web's Alert.alert is a no-op, which silently swallows validation
// errors and confirmation prompts. Map it onto the browser's alert/confirm.
type AlertButton = { text?: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' };

function webAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (typeof window === 'undefined') return;
  const text = [title, message].filter(Boolean).join('\n\n');
  const actions = buttons ?? [];

  if (actions.length <= 1) {
    window.alert(text);
    actions[0]?.onPress?.();
    return;
  }

  const cancel = actions.find((b) => b.style === 'cancel');
  const confirm = actions.find((b) => b !== cancel) ?? actions[0];
  if (window.confirm(text)) {
    confirm.onPress?.();
  } else {
    cancel?.onPress?.();
  }
}

(Alert as any).alert = webAlert;
