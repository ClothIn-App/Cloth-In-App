/**
 * Feed refresh signal: request a refetch when returning to the home feed
 * (e.g. after a successful fitpic post). Home_Grid consumes this on focus.
 */

let feedRefetchRequested = false;

export function requestFeedRefetch(): void {
  feedRefetchRequested = true;
}

export function consumeFeedRefetch(): boolean {
  if (feedRefetchRequested) {
    feedRefetchRequested = false;
    return true;
  }
  return false;
}
