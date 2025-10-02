# Search Components

This directory contains all the search-related components for the Cloth-In app. The search functionality is designed to be modular, reusable, and easily extensible.

## Components Overview

### Core Components

- **`SearchBar`** - Main search component that handles input, suggestions, and results display
- **`SearchResults`** - Displays search results with filtering capabilities
- **`SearchSuggestions`** - Shows search suggestions, recent searches, and trending searches
- **`SearchFilters`** - Category and sort filters for search results

### Result Components

- **`UserSearchResult`** - Individual user search result card
- **`ProductSearchResult`** - Individual product search result card
- **`HashtagSearchResult`** - Individual hashtag search result card
- **`FitPicSearchResult`** - Individual FitPic search result card

## Features

### Search Functionality
- Real-time search suggestions
- Recent search history
- Trending searches
- Category-based filtering (All, Users, FitPics, Products, Hashtags)
- Sort options (Relevance, Newest, Most Liked, Most Saved)

### User Experience
- Smooth animations and transitions
- Responsive design
- Dark/light theme support
- Keyboard-friendly navigation
- Pull-to-refresh support

### Data Management
- Mock data for development
- Type-safe with TypeScript
- Custom hooks for state management
- Easy API integration ready

## Usage

```tsx
import { SearchBar } from '@/components/search';

export default function SearchScreen() {
  return <SearchBar />;
}
```

## Customization

### Adding New Search Categories
1. Update `SearchCategory` type in `src/types/search.ts`
2. Add category to `CATEGORIES` array in `SearchFilters.tsx`
3. Update mock data in `src/mocks/searchMocks.ts`

### Adding New Result Types
1. Create a new result component (e.g., `BrandSearchResult.tsx`)
2. Add the result type to `SearchResult` interface
3. Update `SearchResults.tsx` to handle the new type
4. Add mock data for the new type

### Styling
All components use the app's theming system with `useThemeColor` hook. Colors are defined in `constants/Colors.ts`.

## API Integration

The search components are designed to work with mock data but are ready for API integration:

1. Replace mock data calls in `useSearch.ts` with actual API calls
2. Update the search hook to handle loading states and errors
3. Implement pagination for large result sets
4. Add caching for better performance

## File Structure

```
components/search/
├── README.md
├── index.ts
├── search-bar.tsx          # Main search component
├── SearchResults.tsx       # Results display
├── SearchSuggestions.tsx   # Suggestions panel
├── SearchFilters.tsx       # Category/sort filters
├── UserSearchResult.tsx    # User result card
├── ProductSearchResult.tsx # Product result card
├── HashtagSearchResult.tsx # Hashtag result card
└── FitPicSearchResult.tsx  # FitPic result card
```

## Dependencies

- React Native
- React Native Safe Area Context
- Expo (for StatusBar)
- Custom theming system
- TypeScript

## Future Enhancements

- Voice search integration
- Image search capabilities
- Advanced filters (price range, brand, etc.)
- Search analytics
- Personalized search results
- Search history sync across devices
