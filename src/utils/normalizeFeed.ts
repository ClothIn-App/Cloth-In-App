import { Image } from 'react-native';
import { 
  FeedItem, 
  FitPicItem, 
  ProductItem, 
  RawFitPic,
  RawFitPicsData, 
  RawProductsData 
} from '../types/feed';
import { FITPIC_ASSETS, PRODUCT_ASSETS } from '../maps/images';

// Load raw data from JSON files
const loadRawData = async () => {
  const [fitpicsData, productsData] = await Promise.all([
    import('../mocks/mock-fitpics.json') as unknown as Promise<{ default: RawFitPicsData }>,
    import('../mocks/mock-products.json') as Promise<{ default: RawProductsData }>
  ]);

  return {
    fitpics: fitpicsData.default.fitpics,
    products: productsData.default.products
  };
};

// Get image dimensions using Image.resolveAssetSource
const getImageDimensions = async (source: any): Promise<{ width: number; height: number } | undefined> => {
  try {
    const resolved = Image.resolveAssetSource(source);
    if (resolved && resolved.width && resolved.height) {
      return {
        width: resolved.width,
        height: resolved.height
      };
    }
  } catch (error) {
    console.warn('Failed to resolve image dimensions:', error);
  }
  return undefined;
};

// Recursive helper to normalize comments (convert 'like' to 'likes', 'dislike' to 'dislikes')
const normalizeComment = (rawComment: any): any => {
  return {
    id: rawComment.id,
    user: rawComment.user,
    text: rawComment.text,
    createdAt: rawComment.createdAt,
    likes: rawComment.likes ?? rawComment.like ?? 0,
    dislikes: rawComment.dislikes ?? rawComment.dislike ?? 0,
    replies: (rawComment.replies || []).map(normalizeComment),
  };
};

// Convert raw FitPic data to FitPicItem
const normalizeFitPic = async (rawFitPic: any): Promise<FitPicItem> => {
  const source = FITPIC_ASSETS[rawFitPic.id];
  if (!source) {
    throw new Error(`No asset found for FitPic ID: ${rawFitPic.id}`);
  }

  const dimensions = await getImageDimensions(source);

  return {
    id: rawFitPic.id,
    type: 'fitpic',
    source,
    caption: rawFitPic.caption,
    featuredProducts: rawFitPic.featuredProducts,
    featuredProductIds: rawFitPic.featuredProductIds,
    likes: rawFitPic.likes,
    author: rawFitPic.author,
    createdAt: rawFitPic.createdAt,
    location: rawFitPic.location,
    reactions: rawFitPic.reactions,
    comments: rawFitPic.comments ? rawFitPic.comments.map(normalizeComment) : undefined,
    ...dimensions
  };
};

// Convert raw Product data to ProductItem
const normalizeProduct = async (rawProduct: any): Promise<ProductItem> => {
  const source = PRODUCT_ASSETS[rawProduct.id];
  if (!source) {
    throw new Error(`No asset found for Product ID: ${rawProduct.id}`);
  }

  // Products don't need dimensions since they're always square in the grid
  // The grid layout will handle the sizing based on column width

  return {
    id: rawProduct.id,
    type: 'product',
    source,
    name: rawProduct.name,
    brand: rawProduct.brand,
    price: rawProduct.price,
    salePrice: rawProduct.salePrice,
    category: rawProduct.category,
    description: rawProduct.description,
    createdAt: new Date().toISOString(), // Products don't have createdAt in raw data, so we use current time
    // No dimensions needed for products - they're always square
  };
};

// Main function to build the unified home feed
export const buildHomeFeed = async (): Promise<FeedItem[]> => {
  try {
    const { fitpics, products } = await loadRawData();

    // Normalize all items in parallel
    const [normalizedFitPics, normalizedProducts] = await Promise.all([
      Promise.all(fitpics.map(normalizeFitPic)),
      Promise.all(products.map(normalizeProduct))
    ]);

    // Combine and sort by creation date (newest first)
    const allItems: FeedItem[] = [...normalizedFitPics, ...normalizedProducts];
    
    return allItems.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error building home feed:', error);
    return [];
  }
};

// Utility function to get only FitPics
export const buildFitPicFeed = async (): Promise<FitPicItem[]> => {
  const feed = await buildHomeFeed();
  return feed.filter((item): item is FitPicItem => item.type === 'fitpic');
};

// Utility function to get only Products
export const buildProductFeed = async (): Promise<ProductItem[]> => {
  const feed = await buildHomeFeed();
  return feed.filter((item): item is ProductItem => item.type === 'product');
};
