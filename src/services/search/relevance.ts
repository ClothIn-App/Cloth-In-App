/**
 * Relevance scoring algorithm
 * Calculates relevance scores for search results based on query matching
 */

/**
 * Calculate relevance score for a query against text content
 * Higher score = more relevant
 * 
 * Scoring factors:
 * - Exact match: 100 points
 * - Starts with query: 80 points
 * - Contains query: 50 points
 * - Partial word match: 30 points
 * - Word boundary match bonus: +20 points
 */
export function calculateRelevanceScore(query: string, text: string): number {
  if (!text || !query) return 0;

  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase().trim();

  // Exact match (case insensitive)
  if (textLower === queryLower) {
    return 100;
  }

  // Starts with query
  if (textLower.startsWith(queryLower)) {
    // Check if it's at a word boundary
    const afterMatch = textLower[queryLower.length];
    if (!afterMatch || !/\w/.test(afterMatch)) {
      return 90; // Word boundary bonus
    }
    return 80;
  }

  // Contains query
  const index = textLower.indexOf(queryLower);
  if (index !== -1) {
    let score = 50;
    
    // Word boundary bonus
    const beforeChar = index > 0 ? textLower[index - 1] : ' ';
    const afterChar = index + queryLower.length < textLower.length 
      ? textLower[index + queryLower.length] 
      : ' ';
    
    if (!/\w/.test(beforeChar) && !/\w/.test(afterChar)) {
      score += 20; // Word boundary match
    }

    // Position bonus (earlier in text = more relevant)
    const positionRatio = 1 - (index / Math.max(textLower.length, 1));
    score += positionRatio * 10;

    return score;
  }

  // Partial word match (query matches part of a word)
  const words = textLower.split(/\s+/);
  let maxPartialScore = 0;
  
  for (const word of words) {
    if (word.includes(queryLower)) {
      const partialRatio = queryLower.length / word.length;
      maxPartialScore = Math.max(maxPartialScore, 30 * partialRatio);
    }
    
    if (queryLower.includes(word) && word.length >= 3) {
      maxPartialScore = Math.max(maxPartialScore, 25);
    }
  }

  if (maxPartialScore > 0) {
    return maxPartialScore;
  }

  // Fuzzy match (character similarity)
  const similarity = calculateSimilarity(queryLower, textLower);
  if (similarity > 0.6) {
    return similarity * 20;
  }

  return 0;
}

/**
 * Calculate similarity between two strings using Levenshtein-like approach
 * Returns a value between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  // Simple character overlap calculation
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;

  const matches = [];
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches.push(shorter[i]);
    }
  }

  return matches.length / longer.length;
}

/**
 * Calculate relevance score for multiple text fields
 * Returns the highest score from any field
 */
export function calculateMultiFieldRelevance(
  query: string,
  fields: (string | undefined | null)[]
): number {
  const validFields = fields.filter((f): f is string => Boolean(f));
  if (validFields.length === 0) return 0;

  return Math.max(...validFields.map(field => calculateRelevanceScore(query, field)));
}

/**
 * Boost score based on metadata
 */
export function applyRelevanceBoosts(
  baseScore: number,
  boosts: {
    verified?: boolean;
    highEngagement?: boolean;
    recent?: boolean;
    exactMatch?: boolean;
  }
): number {
  let boostedScore = baseScore;

  if (boosts.verified) {
    boostedScore += 10;
  }

  if (boosts.highEngagement) {
    boostedScore += 15;
  }

  if (boosts.recent) {
    boostedScore += 5;
  }

  if (boosts.exactMatch) {
    boostedScore *= 1.2; // 20% multiplier
  }

  return boostedScore;
}

