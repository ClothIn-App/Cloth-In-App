import { router } from 'expo-router';

/**
 * Navigate to another user's profile screen.
 *
 * Self-view policy A: we always push the /user/[userId] route. The screen
 * itself detects when viewedUserId === currentUserId and hides the Follow
 * button, showing "This is you" instead. This avoids async uid resolution
 * here and keeps all 11 call sites unchanged.
 */
export function openUserProfile(userId: string): void {
  if (!userId) return;
  router.push(`/user/${userId}`);
}
