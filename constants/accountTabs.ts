export const ACCOUNT_TABS_BASE = [
  { key: "fitpics",  label: "FitPics" },
  { key: "closet",   label: "Closet" },
  { key: "products", label: "Products" },
  { key: "saved",    label: "Saved" },
  { key: "tagged",   label: "Tagged" },
] as const;

export type AccountTab = { key: string; label: string };
export type AccountType = "personal" | "brand" | "creator" | undefined;

export function getAccountTabs(accountType?: AccountType): AccountTab[] {
  switch (accountType) {
    case "brand":
      return [
        { key: "products", label: "Products" },
        { key: "fitpics",  label: "FitPics" },
        { key: "tagged",   label: "Tagged" },
        { key: "saved",    label: "Saved" },
      ];
    case "creator":
      return [
        { key: "fitpics",  label: "FitPics" },
        { key: "tagged",   label: "Tagged" },
        { key: "saved",    label: "Saved" },
      ];
    default:
      return [...ACCOUNT_TABS_BASE];
  }
}
