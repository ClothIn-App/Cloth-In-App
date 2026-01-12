/**
 * FitPic filtering and sorting logic
 */

import type { FitPicSearchResult } from '../../../types/search';
import type { FitPicSearchFilters, FitPicSortBy } from '../types';

/**
 * Filter fitpics based on search filters
 */
export function filterFitPics(
  fitpics: FitPicSearchResult[],
  filters: FitPicSearchFilters = {}
): FitPicSearchResult[] {
  let filtered = [...fitpics];

  if (filters.dateRange) {
    const startDate = new Date(filters.dateRange.start).getTime();
    const endDate = new Date(filters.dateRange.end).getTime();
    filtered = filtered.filter(fitpic => {
      const createdAt = new Date(fitpic.createdAt).getTime();
      return createdAt >= startDate && createdAt <= endDate;
    });
  }

  if (filters.minLikes !== undefined) {
    filtered = filtered.filter(fitpic => fitpic.engagement.likes >= filters.minLikes!);
  }

  if (filters.minSaves !== undefined) {
    filtered = filtered.filter(fitpic => fitpic.engagement.saves >= filters.minSaves!);
  }

  if (filters.hashtags && filters.hashtags.length > 0) {
    filtered = filtered.filter(fitpic => {
      const fitpicHashtags = fitpic.hashtags || [];
      return filters.hashtags!.some(tag => 
        fitpicHashtags.some(ht => ht.toLowerCase() === tag.toLowerCase())
      );
    });
  }

  if (filters.excludeHashtags && filters.excludeHashtags.length > 0) {
    filtered = filtered.filter(fitpic => {
      const fitpicHashtags = fitpic.hashtags || [];
      return !filters.excludeHashtags!.some(tag => 
        fitpicHashtags.some(ht => ht.toLowerCase() === tag.toLowerCase())
      );
    });
  }

  if (filters.authorId) {
    filtered = filtered.filter(fitpic => fitpic.authorId === filters.authorId);
  }

  return filtered;
}

/**
 * Sort fitpics based on sort option
 */
export function sortFitPics(fitpics: FitPicSearchResult[], sortBy: FitPicSortBy = 'relevance'): FitPicSearchResult[] {
  const sorted = [...fitpics];

  switch (sortBy) {
    case 'relevance':
      return sorted;

    case 'newest':
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    case 'most_liked':
      return sorted.sort((a, b) => b.engagement.likes - a.engagement.likes);

    case 'most_saved':
      return sorted.sort((a, b) => b.engagement.saves - a.engagement.saves);

    case 'most_commented':
      return sorted.sort((a, b) => b.engagement.comments - a.engagement.comments);

    default:
      return sorted;
  }
}

