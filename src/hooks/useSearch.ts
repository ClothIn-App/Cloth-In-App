import { useReducer, useCallback, useMemo } from 'react';
import { SearchState, SearchAction, SearchFilters, SearchCategory } from '../types/search';
import { getMockSuggestions, getMockSearchResults } from '../mocks/searchMocks';

const initialState: SearchState = {
  query: '',
  isSearching: false,
  results: {
    users: [],
    fitpics: [],
    products: [],
    hashtags: [],
  },
  suggestions: [],
  recentSearches: [],
  trendingSearches: [],
  filters: {
    category: 'all',
  },
  hasSearched: false,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: action.payload,
        suggestions: action.payload ? getMockSuggestions(action.payload) : [],
        error: undefined,
      };
    
    case 'SET_SEARCHING':
      return {
        ...state,
        isSearching: action.payload,
      };
    
    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload,
        isSearching: false,
        hasSearched: true,
        error: undefined,
      };
    
    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload,
      };
    
    case 'ADD_RECENT_SEARCH':
      const newRecentSearches = [action.payload, ...state.recentSearches.filter(s => s !== action.payload)].slice(0, 10);
      return {
        ...state,
        recentSearches: newRecentSearches,
      };
    
    case 'CLEAR_RECENT_SEARCHES':
      return {
        ...state,
        recentSearches: [],
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isSearching: false,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: undefined,
      };
    
    case 'RESET_SEARCH':
      return {
        ...initialState,
        recentSearches: state.recentSearches,
        trendingSearches: state.trendingSearches,
      };
    
    default:
      return state;
  }
}

export function useSearch() {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    dispatch({ type: 'SET_SEARCHING', payload: true });
    dispatch({ type: 'ADD_RECENT_SEARCH', payload: query.trim() });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const results = getMockSearchResults(query);
      dispatch({ type: 'SET_RESULTS', payload: results });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Search failed. Please try again.' });
    }
  }, []);

  const setQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_QUERY', payload: query });
  }, []);

  const clearRecentSearches = useCallback(() => {
    dispatch({ type: 'CLEAR_RECENT_SEARCHES' });
  }, []);

  const setFilters = useCallback((filters: Partial<SearchFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const resetSearch = useCallback(() => {
    dispatch({ type: 'RESET_SEARCH' });
  }, []);

  const filteredResults = useMemo(() => {
    if (state.filters.category === 'all') {
      return state.results;
    }

    return {
      users: state.filters.category === 'users' ? state.results.users : [],
      fitpics: state.filters.category === 'fitpics' ? state.results.fitpics : [],
      products: state.filters.category === 'products' ? state.results.products : [],
      hashtags: state.filters.category === 'hashtags' ? state.results.hashtags : [],
    };
  }, [state.results, state.filters.category]);

  const hasResults = useMemo(() => {
    return Object.values(filteredResults).some(category => category.length > 0);
  }, [filteredResults]);

  return {
    ...state,
    filteredResults,
    hasResults,
    search,
    setQuery,
    clearRecentSearches,
    setFilters,
    clearError,
    resetSearch,
  };
}
