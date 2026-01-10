/**
 * Category-specific search functions
 * Re-exports search functions from individual category modules
 * 
 * This file maintains the original API surface while delegating
 * to separate, focused modules for better maintainability.
 */

export { searchUsers } from './userSearch';
export { searchFitPics } from './fitpicSearch';
export { searchProducts } from './productSearch';
export { searchHashtags } from './hashtagSearch';
