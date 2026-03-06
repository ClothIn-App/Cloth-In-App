// Core account/profile types used by the Account Screen Shell

export type ProfileMe = {
  uid: string;
  name?: string;
  displayName?: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  joinedAt?: string; // ISO date string
  accountType?: "personal" | "brand" | "creator";
};

export type ProfileCounts = {
  posts: number;
  following: number;
  followers: number;
};

export type FollowerUser = {
  uid: string;
  displayName?: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isFollowing?: boolean;
  isPrivateAccount?: boolean;
};

export type FollowingUser = {
  uid: string;
  displayName?: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isFollowing?: boolean;
  isPrivateAccount?: boolean;
};

// Convenience aggregate used by the hook
export type AccountData = {
  me?: ProfileMe;
  counts?: ProfileCounts;
};
