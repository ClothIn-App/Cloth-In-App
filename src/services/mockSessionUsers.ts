import type { FollowerUser, FollowingUser } from "../types/account";

export type RawUser = {
  id: string;
  displayName?: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  accountType?: "personal" | "brand" | "creator";
  followers?: {
    total?: number;
    userIds?: string[];
  };
  following?: {
    total?: number;
    userIds?: string[];
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

const isRealMode = process.env.EXPO_PUBLIC_API_MODE === "real";

let realCurrentUserId: string | null = null;
let realCurrentUser: RawUser | null = null;

export function setRealCurrentUser(userId: string, user?: RawUser | null): void {
  realCurrentUserId = userId;
  realCurrentUser = user === undefined ? { id: userId, username: userId } : user;
}

export function clearRealCurrentUser(): void {
  realCurrentUserId = null;
  realCurrentUser = null;
}

/** Map API user shape (e.g. GetUserResponse.user) to RawUser for real-mode cache. */
export function mapGetUserResponseToRawUser(
  user: {
    uid: string;
    username?: string;
    displayName?: string | null;
    avatarUrl?: string;
    bio?: string | null;
    accountType?: string | null;
    privacy?: { isPrivateAccount?: boolean };
    counts?: { posts?: number; following?: number; followers?: number };
    closet?: RawUser["closet"];
    savedFitpics?: string[];
    savedProducts?: string[];
  },
  userId: string
): RawUser {
  const savedFitpics = user.savedFitpics ?? [];
  const savedProducts = user.savedProducts ?? [];
  const saved: { id: string; type: string }[] = [
    ...savedFitpics.map((id) => ({ id, type: "fitpic" as const })),
    ...savedProducts.map((id) => ({ id, type: "product" as const })),
  ];
  return {
    id: user.uid ?? userId,
    username: user.username ?? user.uid ?? userId,
    displayName: user.displayName ?? undefined,
    avatarUrl: user.avatarUrl,
    bio: user.bio ?? undefined,
    accountType: (user.accountType as RawUser["accountType"]) ?? "personal",
    privacy: user.privacy,
    closet: user.closet,
    followers: user.counts ? { total: user.counts.followers } : undefined,
    following: user.counts ? { total: user.counts.following } : undefined,
    fitpics: user.counts ? { total: user.counts.posts } : undefined,
    saved,
  };
}

type SessionData = {
  currentUserId: string;
  isLoggedIn: boolean;
};

// Synchronous session functions - load data lazily on first call (mock mode only)
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
  if (isRealMode) return realCurrentUserId ?? "";
  const session = ensureSessionDataLoaded();
  return session.currentUserId;
}

export function isLoggedIn(): boolean {
  if (isRealMode) return realCurrentUserId != null;
  const session = ensureSessionDataLoaded();
  return session.isLoggedIn === true;
}

export function getUserById(userId: string | undefined): RawUser | undefined {
  if (!userId) return undefined;
  if (isRealMode) {
    if (userId === realCurrentUserId) return realCurrentUser ?? undefined;
    return undefined;
  }
  const users = ensureUsersDataLoaded();
  return users[userId];
}

export function getCurrentUser(overriddenUserId?: string): RawUser | undefined {
  if (isRealMode) {
    const userId = overriddenUserId ?? realCurrentUserId;
    if (userId == null) return undefined;
    if (userId === realCurrentUserId) return realCurrentUser ?? undefined;
    return undefined;
  }
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


