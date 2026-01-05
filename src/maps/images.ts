import { ImageSourcePropType } from 'react-native';

// FitPic asset mappings - maps JSON IDs to require() statements
export const FITPIC_ASSETS: Record<string, ImageSourcePropType> = {
  'FP_1': require('../../assets/mock-images/abheet-singh-sachdeva-VYc45RkdeuA-unsplash.jpg'),
  'FP_2': require('../../assets/mock-images/evgeni-tcherkasski-GsSUlbzXIec-unsplash.jpg'),
  'FP_3': require('../../assets/mock-images/evgeni-tcherkasski-hegb9Y8dKos-unsplash.jpg'),
  'FP_4': require('../../assets/mock-images/joshua-kettle-q8DovYzpoR8-unsplash.jpg'),
  'FP_5': require('../../assets/mock-images/masood-aslami-sSw20FmZvX4-unsplash.jpg'),
  'FP_6': require('../../assets/mock-images/nikita-pishchugin-B0mydNIV-sI-unsplash.jpg'),
  'FP_7': require('../../assets/mock-images/quiet-studio-wEMXOQwjG58-unsplash.jpg'),
  'FP_8': require('../../assets/mock-images/samsung-memory-us-2ofwyNTTvL8-unsplash.jpg'),
};

// Product asset mappings - maps JSON IDs to require() statements
export const PRODUCT_ASSETS: Record<string, ImageSourcePropType> = {
  'c-d-x-product': require('../../assets/mock-products/c-d-x-PDX_a_82obo-unsplash.jpg'),
  'daniel-korpai-product': require('../../assets/mock-products/daniel-korpai-hbTKIbuMmBI-unsplash.jpg'),
  'domino-studio-product': require('../../assets/mock-products/domino-studio-164_6wVEHfI-unsplash.jpg'),
  'fernando-andrade-product': require('../../assets/mock-products/fernando-andrade-potCPE_Cw8A-unsplash.jpg'),
  'giorgio-trovato-product': require('../../assets/mock-products/giorgio-trovato-K62u25Jk6vo-unsplash.jpg'),
  'joan-tran-product': require('../../assets/mock-products/joan-tran-reEySFadyJQ-unsplash.jpg'),
  'mohammad-metri-product': require('../../assets/mock-products/mohammad-metri-E-0ON3VGrBc-unsplash.jpg'),
  'rachit-tank-product': require('../../assets/mock-products/rachit-tank-2cFZ_FB08UM-unsplash.jpg'),
};

// Helper function to get asset by ID and type
export const getAssetById = (id: string, type: 'fitpic' | 'product'): ImageSourcePropType | undefined => {
  if (type === 'fitpic') {
    return FITPIC_ASSETS[id];
  } else if (type === 'product') {
    return PRODUCT_ASSETS[id];
  }
  return undefined;
};
