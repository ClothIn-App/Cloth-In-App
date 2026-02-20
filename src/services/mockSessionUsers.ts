import type { FollowerUser, FollowingUser } from "../types/account";

type RawUser = {
  id: string;
  displayName?: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  accountType?: "personal" | "brand" | "creator";
  followers?: { 
    total?: number;
    userIds?: string[] 
  };
  following?: { 
    total?: number;
    userIds?: string[] 
  };
  fitpics?: {
    total?: number;
    postedIds?: string[];
  };
  privacy?: { isPrivateAccount?: boolean };
  saved?: { id: string; type: string }[];
  closet?: {
    base?: { productIds?: string[] };
    racks?: Array<{
      id: string;
      name: string;
      productIds?: string[];
      createdAt?: number;
    }>;
  };
};

type SessionData = {
  currentUserId: string;
  isLoggedIn: boolean;
};

// Synchronous session functions - load data lazily on first call
// Note: This utility is used by endpoints, which are allowed to import JSON.
// We use lazy loading (require on first access) rather than static imports at module level.
// Note: In a real app, these would come from auth context, but for mock mode
// we need synchronous access, so we load and cache the data
let sessionDataSync: SessionData | null = null;

function ensureSessionDataLoaded(): SessionData {
  if (!sessionDataSync) {
    // For synchronous access, we need to load synchronously
    // This is acceptable for mock utilities used by endpoints
    // In production, this would come from auth context
    const data = require("../mocks/mock-session.json");
    sessionDataSync = data as SessionData;
  }
  return sessionDataSync;
}

let usersDataSync: Record<string, RawUser> | null = null;

function ensureUsersDataLoaded(): Record<string, RawUser> {
  if (!usersDataSync) {
    // For synchronous access, we need to load synchronously
    // This is acceptable for mock utilities used by endpoints
    // In production, this would come from userClient or auth context
    const data = require("../mocks/mock-users.json");
    usersDataSync = data as Record<string, RawUser>;
  }
  return usersDataSync;
}

export function getCurrentUserId(): string {
  const session = ensureSessionDataLoaded();
  return session.currentUserId;
}

export function isLoggedIn(): boolean {
  const session = ensureSessionDataLoaded();
  return session.isLoggedIn === true;
}

export function getUserById(userId: string | undefined): RawUser | undefined {
  if (!userId) return undefined;
  const users = ensureUsersDataLoaded();
  return users[userId];
}

export function getCurrentUser(overriddenUserId?: string): RawUser | undefined {
  const userId = overriddenUserId ?? getCurrentUserId();
  return getUserById(userId);
}

export function getFollowersForUser(userId: string): FollowerUser[] {
  const profileUser = getUserById(userId);
  if (!profileUser) return [];

  const followerIds = profileUser.followers?.userIds ?? [];

  const currentUser = getCurrentUser();
  const currentUserFollowingIds = new Set(
    currentUser?.following?.userIds ?? []
  );

  return followerIds
    .map((followerId): FollowerUser | null => {
      const user = getUserById(followerId);
      if (!user) return null;

      return {
        uid: user.id,
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isFollowing: currentUserFollowingIds.has(user.id),
        isPrivateAccount: !!user.privacy?.isPrivateAccount,
      };
    })
    .filter((u): u is FollowerUser => u !== null);
}

export function getFollowingForUser(userId: string): FollowingUser[] {
  const profileUser = getUserById(userId);
  if (!profileUser) return [];

  const followingIds = profileUser.following?.userIds ?? [];

  const currentUser = getCurrentUser();
  const currentUserFollowingIds = new Set(
    currentUser?.following?.userIds ?? []
  );

  return followingIds
    .map((followingId): FollowingUser | null => {
      const user = getUserById(followingId);
      if (!user) return null;

      return {
        uid: user.id,
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isFollowing: currentUserFollowingIds.has(user.id),
        isPrivateAccount: !!user.privacy?.isPrivateAccount,
      };
    })
    .filter((u): u is FollowingUser => u !== null);
}


