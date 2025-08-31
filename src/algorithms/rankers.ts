/**
 * Temporary stub for ranking functions.
 * Replace with real logic later.
 */

export type Ranker<T> = (items: T[]) => T[];

/** No-op: returns posts as-is (Following feed). */
export const rankFollowing: Ranker<any> = (items) => items;

/** No-op: returns posts as-is (For You feed). */
export const rankForYou: Ranker<any> = (items) => items;

export default { rankFollowing, rankForYou };
