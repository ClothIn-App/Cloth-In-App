// Core account/profile types used by the Account Screen Shell

export type ProfileMe = {
  uid: string;
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

// Convenience aggregate used by the hook
export type AccountData = {
  me?: ProfileMe;
  counts?: ProfileCounts;
};
