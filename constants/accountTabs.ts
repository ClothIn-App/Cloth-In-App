export const ACCOUNT_TABS_BASE = [
  { key: "fitpics",  label: "FitPics" },
  { key: "closet",   label: "Closet" },
  { key: "saved",    label: "Saved" },
] as const;

export type AccountTab = { key: string; label: string };
export type AccountType = "personal" | "brand" | "creator" | undefined;

export function getAccountTabs(accountType?: AccountType): AccountTab[] {
  // Always return the same 3 tabs regardless of account type
  return [...ACCOUNT_TABS_BASE];
}
