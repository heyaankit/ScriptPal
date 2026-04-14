// ─── Option label/value pairs ────────────────────────────────────────────────

export interface Option<V extends string = string> {
  value: V;
  label: string;
  color?: string;
}

// ─── Context (script setting) ────────────────────────────────────────────────

export type Context = "home" | "school" | "car" | "bedtime";

export const CONTEXT_OPTIONS: Option<Context>[] = [
  { value: "home", label: "Home" },
  { value: "school", label: "School" },
  { value: "car", label: "Car" },
  { value: "bedtime", label: "Bedtime" },
];

// ─── Emotional State ─────────────────────────────────────────────────────────

export type EmotionalState = "happy" | "sad" | "angry" | "anxious" | "excited" | "neutral";

export const EMOTIONAL_STATE_OPTIONS: Option<EmotionalState>[] = [
  { value: "happy", label: "Happy", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { value: "sad", label: "Sad", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "angry", label: "Angry", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  { value: "anxious", label: "Anxious", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "excited", label: "Excited", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  { value: "neutral", label: "Neutral", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
];

// ─── Source ──────────────────────────────────────────────────────────────────

export type Source = "tv" | "song" | "parent" | "school" | "unknown";

export const SOURCE_OPTIONS: Option<Source>[] = [
  { value: "tv", label: "TV / Movies" },
  { value: "song", label: "Song / Music" },
  { value: "parent", label: "Parent / Caregiver" },
  { value: "school", label: "School / Therapy" },
  { value: "unknown", label: "Unknown" },
];

// ─── Frequency ───────────────────────────────────────────────────────────────

export type Frequency = "new" | "repeated" | "variation";

export const FREQUENCY_OPTIONS: Option<Frequency>[] = [
  { value: "new", label: "New" },
  { value: "repeated", label: "Repeated" },
  { value: "variation", label: "Variation" },
];

// ─── Report Period ───────────────────────────────────────────────────────────

export type ReportPeriod = "week" | "month" | "quarter";

export const REPORT_PERIOD_OPTIONS: Option<ReportPeriod>[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
];

// ─── Schedule Frequency ──────────────────────────────────────────────────────

export type ScheduleFrequency = "weekly" | "monthly" | "quarterly";

export const SCHEDULE_FREQUENCY_OPTIONS: Option<ScheduleFrequency>[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

// ─── Country Codes (for phone registration) ──────────────────────────────────

export const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: "+1", label: "+1 US" },
  { code: "+44", label: "+44 UK" },
  { code: "+91", label: "+91 India" },
  { code: "+61", label: "+61 Australia" },
  { code: "+81", label: "+81 Japan" },
  { code: "+49", label: "+49 Germany" },
  { code: "+33", label: "+33 France" },
  { code: "+86", label: "+86 China" },
  { code: "+55", label: "+55 Brazil" },
  { code: "+7", label: "+7 Russia" },
  { code: "+82", label: "+82 South Korea" },
  { code: "+39", label: "+39 Italy" },
  { code: "+34", label: "+34 Spain" },
  { code: "+52", label: "+52 Mexico" },
  { code: "+971", label: "+971 UAE" },
  { code: "+65", label: "+65 Singapore" },
  { code: "+27", label: "+27 South Africa" },
  { code: "+20", label: "+20 Egypt" },
  { code: "+62", label: "+62 Indonesia" },
];

// ─── Nav Item (page identifier) ─────────────────────────────────────────────

export type NavItem =
  | "dashboard"
  | "scripts"
  | "activities"
  | "progress"
  | "milestones"
  | "reports"
  | "notifications"
  | "profile"
  | "library";
