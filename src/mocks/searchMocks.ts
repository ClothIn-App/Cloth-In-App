// Mock data for search functionality
import { SearchSuggestion, UserSearchResult, ProductSearchResult, HashtagSearchResult, FitPicSearchResult } from '../types/search';

export const MOCK_TRENDING_SEARCHES: SearchSuggestion[] = [
  { id: '1', text: 'Summer dresses', type: 'trending', category: 'products', count: 1250 },
  { id: '2', text: 'Denim jackets', type: 'trending', category: 'products', count: 980 },
  { id: '3', text: 'White sneakers', type: 'trending', category: 'products', count: 2100 },
  { id: '4', text: 'Oversized sweaters', type: 'trending', category: 'products', count: 750 },
  { id: '5', text: 'High-waisted jeans', type: 'trending', category: 'products', count: 1800 },
  { id: '6', text: 'Leather boots', type: 'trending', category: 'products', count: 650 },
  { id: '7', text: 'Crop tops', type: 'trending', category: 'products', count: 1400 },
  { id: '8', text: 'Midi skirts', type: 'trending', category: 'products', count: 920 },
  { id: '9', text: '#OOTD', type: 'trending', category: 'hashtags', count: 5000 },
  { id: '10', text: '#Fashion', type: 'trending', category: 'hashtags', count: 12000 },
  { id: '11', text: '#Style', type: 'trending', category: 'hashtags', count: 8500 },
  { id: '12', text: '#Outfit', type: 'trending', category: 'hashtags', count: 3200 },
];

export const MOCK_USER_RESULTS: UserSearchResult[] = [
  {
    id: '1',
    uid: 'user1',
    username: 'fashionista_jen',
    displayName: 'Jennifer Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Fashion blogger & stylist ✨',
    isFollowing: false,
    followerCount: 12500,
    verified: true,
  },
  {
    id: '2',
    uid: 'user2',
    username: 'style_maven',
    displayName: 'Sarah Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Sustainable fashion advocate 🌱',
    isFollowing: true,
    followerCount: 8900,
    verified: false,
  },
  {
    id: '3',
    uid: 'user3',
    username: 'trendy_tom',
    displayName: 'Tom Wilson',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Streetwear enthusiast 🏙️',
    isFollowing: false,
    followerCount: 5600,
    verified: false,
  },
];

export const MOCK_PRODUCT_RESULTS: ProductSearchResult[] = [
  {
    id: '1',
    name: 'Classic White Sneakers',
    brand: 'Nike',
    category: 'Shoes',
    price: 89.99,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
    purchaseUrl: 'https://nike.com/white-sneakers',
    rating: 4.5,
    reviewCount: 1240,
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Oversized Denim Jacket',
    brand: 'Levi\'s',
    category: 'Outerwear',
    price: 129.99,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300&h=300&fit=crop',
    purchaseUrl: 'https://levis.com/denim-jacket',
    rating: 4.2,
    reviewCount: 890,
    isAvailable: true,
  },
  {
    id: '3',
    name: 'High-Waisted Black Jeans',
    brand: 'Zara',
    category: 'Bottoms',
    price: 39.99,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&h=300&fit=crop',
    purchaseUrl: 'https://zara.com/black-jeans',
    rating: 4.0,
    reviewCount: 2100,
    isAvailable: true,
  },
];

export const MOCK_HASHTAG_RESULTS: HashtagSearchResult[] = [
  {
    tag: '#OOTD',
    postCount: 5000,
    isTrending: true,
    trendDirection: 'up',
  },
  {
    tag: '#Fashion',
    postCount: 12000,
    isTrending: true,
    trendDirection: 'stable',
  },
  {
    tag: '#Style',
    postCount: 8500,
    isTrending: false,
    trendDirection: 'down',
  },
  {
    tag: '#Outfit',
    postCount: 3200,
    isTrending: true,
    trendDirection: 'up',
  },
  {
    tag: '#SummerFashion',
    postCount: 1800,
    isTrending: false,
    trendDirection: 'stable',
  },
];

export const MOCK_FITPIC_RESULTS: FitPicSearchResult[] = [
  {
    id: '1',
    authorId: 'user1',
    author: {
      uid: 'user1',
      username: 'fashionista_jen',
      displayName: 'Jennifer Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
    },
    photos: [
      {
        id: 'photo1',
        url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=600&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=150&h=200&fit=crop',
        index: 0,
        isCover: true,
      },
    ],
    caption: 'Perfect summer look with this white dress! #OOTD #SummerFashion',
    products: [MOCK_PRODUCT_RESULTS[0]],
    createdAt: '2024-01-15T10:30:00Z',
    engagement: {
      likes: 245,
      saves: 89,
      comments: 23,
    },
    hashtags: ['#OOTD', '#SummerFashion'],
  },
  {
    id: '2',
    authorId: 'user2',
    author: {
      uid: 'user2',
      username: 'style_maven',
      displayName: 'Sarah Johnson',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
    },
    photos: [
      {
        id: 'photo2',
        url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=150&h=200&fit=crop',
        index: 0,
        isCover: true,
      },
    ],
    caption: 'Sustainable fashion never looked so good! 🌱 #SustainableFashion #Style',
    products: [MOCK_PRODUCT_RESULTS[1]],
    createdAt: '2024-01-14T15:45:00Z',
    engagement: {
      likes: 189,
      saves: 67,
      comments: 15,
    },
    hashtags: ['#SustainableFashion', '#Style'],
  },
];

// Mock search suggestions based on query
export const getMockSuggestions = (query: string): SearchSuggestion[] => {
  if (!query.trim()) return MOCK_TRENDING_SEARCHES.slice(0, 8);
  
  const allSuggestions = [
    ...MOCK_TRENDING_SEARCHES,
    ...MOCK_USER_RESULTS.map(user => ({
      id: `user_${user.id}`,
      text: user.username,
      type: 'suggestion' as const,
      category: 'users' as const,
    })),
    ...MOCK_PRODUCT_RESULTS.map(product => ({
      id: `product_${product.id}`,
      text: product.name,
      type: 'suggestion' as const,
      category: 'products' as const,
    })),
  ];
  
  return allSuggestions
    .filter(suggestion => {
      const suggestionText = suggestion.text.toLowerCase();
      const queryText = query.toLowerCase();
      
      // For hashtags, allow matching with or without the # symbol
      if (suggestion.category === 'hashtags') {
        const suggestionWithoutHash = suggestionText.replace('#', '');
        const queryWithoutHash = queryText.replace('#', '');
        return suggestionWithoutHash.startsWith(queryWithoutHash);
      }
      
      // For regular suggestions, use normal startsWith matching
      return suggestionText.startsWith(queryText);
    })
    .slice(0, 8);
};

// Mock search results based on query
export const getMockSearchResults = (query: string) => {
  const lowerQuery = query.toLowerCase();
  
  return {
    users: MOCK_USER_RESULTS.filter(user => 
      user.username.toLowerCase().includes(lowerQuery) ||
      user.displayName?.toLowerCase().includes(lowerQuery) ||
      user.bio?.toLowerCase().includes(lowerQuery)
    ),
    fitpics: MOCK_FITPIC_RESULTS.filter(fitpic => 
      fitpic.caption.toLowerCase().includes(lowerQuery) ||
      fitpic.hashtags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      fitpic.products.some(product => product.name.toLowerCase().includes(lowerQuery))
    ),
    products: MOCK_PRODUCT_RESULTS.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.brand?.toLowerCase().includes(lowerQuery) ||
      product.category?.toLowerCase().includes(lowerQuery)
    ),
    hashtags: MOCK_HASHTAG_RESULTS.filter(hashtag => 
      hashtag.tag.toLowerCase().includes(lowerQuery)
    ),
  };
};
