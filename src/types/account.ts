// Core account/profile types used by the Account Screen Shell

export type ProfileMe = {
  uid: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  joinedAt?: string; // ISO date string
};

export type ProfileCounts = {
  posts: number;
  following: number;
  followers: number;
};

// Allowed tabs for now (kept narrow so UI gets autocomplete)
export type AccountTabKey = string;

export type ProfileTab = {
  key: AccountTabKey;
  label: string;
};

export type ProfileTabs = {
  tabs: ProfileTab[];
  defaultKey: AccountTabKey;
};

// Convenience aggregate used by the hook (optional)
export type AccountData = {
  me?: ProfileMe;
  counts?: ProfileCounts;
  tabs?: ProfileTabs;
};
