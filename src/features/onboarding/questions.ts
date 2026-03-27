export const ONBOARDING_VERSION = "1";

export type OptionItem = { value: string; label: string };

export type OnboardingQuestionId =
  | "styleIdentity"
  | "styleVibes"
  | "categories"
  | "occasions"
  | "priceTiers";

export type OnboardingQuestion = {
  id: OnboardingQuestionId;
  heading: string;
  subheading?: string;
  options: OptionItem[];
};

export const STYLE_IDENTITY_OPTIONS: OptionItem[] = [
  { value: "masculine", label: "Masculine" },
  { value: "feminine", label: "Feminine" },
  { value: "gender_neutral", label: "Gender-Neutral" },
];

export const STYLE_VIBES_OPTIONS: OptionItem[] = [
  { value: "streetwear", label: "Streetwear" },
  { value: "minimalist", label: "Minimalist" },
  { value: "classic", label: "Classic" },
  { value: "vintage_retro", label: "Vintage / Retro" },
  { value: "workwear_office", label: "Workwear / Office" },
  { value: "athleticwear_activewear", label: "Athleticwear / Activewear" },
  { value: "techwear", label: "Techwear" },
  { value: "city_elevated_casual", label: "City / Elevated Casual" },
];

export const CATEGORY_OPTIONS: OptionItem[] = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "dresses_jumpsuits", label: "Dresses & Jumpsuits" },
  { value: "outerwear", label: "Outerwear" },
  { value: "intimates_loungewear", label: "Intimates & Loungewear" },
  { value: "activewear", label: "Activewear" },
  { value: "maternity", label: "Maternity" },
  { value: "sets_coords", label: "Sets & Co-ords" },
  { value: "swim_coverups", label: "Swim & Cover-ups" },
  { value: "sneakers", label: "Sneakers" },
  { value: "boots", label: "Boots" },
  { value: "heels", label: "Heels" },
  { value: "sandals", label: "Sandals" },
  { value: "sunglasses", label: "Sunglasses" },
  { value: "hats_beanies", label: "Hats / Beanies" },
  { value: "scarves", label: "Scarves" },
  { value: "belts", label: "Belts" },
];

export const OCCASION_OPTIONS: OptionItem[] = [
  { value: "everyday_out_about", label: "Everyday / Out & About" },
  { value: "weekend", label: "Weekend" },
  { value: "office_work", label: "Office / Work" },
  { value: "workout_sport", label: "Workout / Sport" },
  { value: "date_night", label: "Date Night" },
  { value: "travel", label: "Travel" },
];

export const PRICE_TIER_OPTIONS: OptionItem[] = [
  { value: "budget_0_50", label: "Budget-Friendly ($0–$50)" },
  { value: "mid_50_150", label: "Mid-Range ($50–$150)" },
  { value: "premium_150_500", label: "Premium ($150–$500)" },
  { value: "luxury_500_plus", label: "Luxury ($500+)" },
];

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "styleIdentity",
    heading: "What style(s) are you into?",
    options: STYLE_IDENTITY_OPTIONS,
  },
  {
    id: "styleVibes",
    heading: "What kind of styles are you into right now?",
    options: STYLE_VIBES_OPTIONS,
  },
  {
    id: "categories",
    heading: "What do you usually shop for or wear the most?",
    options: CATEGORY_OPTIONS,
  },
  {
    id: "occasions",
    heading: "What are you usually getting dressed for?",
    options: OCCASION_OPTIONS,
  },
  {
    id: "priceTiers",
    heading: "What price range do you usually shop in?",
    options: PRICE_TIER_OPTIONS,
  },
];

