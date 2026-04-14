import type {
  Context,
  EmotionalState,
  Source,
  Frequency,
  ReportPeriod,
  ScheduleFrequency,
} from "./enums";

// ─── API base URL ────────────────────────────────────────────────────────────
// Override with NEXT_PUBLIC_API_URL in .env.local if the backend runs on a
// different host / port.

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TOKEN_KEY = "scriptpal_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Typed wrapper around fetch that handles auth headers & error extraction. */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; message: string }> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new (await import("./auth-context")).ApiError(
      body.detail || body.error || body.message || `Request failed (${res.status})`,
    );
  }

  // The backend always wraps responses in { success, data, message }
  return { data: body.data ?? body, message: body.message ?? "OK" };
}

// ─── Shared / generic types ─────────────────────────────────────────────────

export interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DailySuggestion {
  text?: string;
  activity_name?: string;
}

export interface RecentScript {
  id: string;
  script_text: string;
  emotional_state: string;
  time_ago: string;
}

export interface WeeklyInsight {
  pattern_found?: string;
  scripts_this_week: number;
  most_repeated?: string;
}

export interface DashboardData {
  greeting?: string;
  sub_message?: string;
  daily_suggestion?: DailySuggestion;
  recent_scripts: RecentScript[];
  weekly_insight?: WeeklyInsight;
}

// ─── Scripts ─────────────────────────────────────────────────────────────────

export interface ScriptResponse {
  id: string;
  script_text: string;
  context: Context;
  emotional_state: EmotionalState;
  source: Source;
  frequency: Frequency;
  meaning?: string | null;
  notes?: string | null;
  time_ago: string;
}

export interface CreateScriptPayload {
  script_text: string;
  context: Context;
  emotional_state: EmotionalState;
  source: Source;
  frequency: Frequency;
  meaning?: string;
  notes?: string;
}

export interface UpdateScriptPayload {
  script_text?: string;
  context?: Context;
  emotional_state?: EmotionalState;
  source?: Source;
  frequency?: Frequency;
  meaning?: string;
  notes?: string;
}

// ─── Progress ────────────────────────────────────────────────────────────────

export interface ProgressSummary {
  total_scripts: number;
  growth_rate?: number;
  positive_emotions_pct?: number;
}

export interface ChartData {
  title?: string;
  labels: string[];
  values: number[];
}

export interface TrendsChart {
  title?: string;
  labels: string[];
  scripts: number[];
  positive_pct: number[];
  growth_rate: number[];
}

export interface RecentMilestone {
  id: string;
  title: string;
  icon?: string | null;
  achieved_on: string;
}

// ─── Milestones ─────────────────────────────────────────────────────────────

export interface MilestoneResponse {
  id: string;
  title: string;
  icon?: string | null;
  achieved_on: string;
}

export interface CreateMilestonePayload {
  title: string;
  icon?: string;
  achieved_on: string;
}

// ─── Activities ──────────────────────────────────────────────────────────────

export interface ActivityResponse {
  id: string;
  title: string;
  description: string;
  image_url?: string | null;
  age_range?: string | null;
  stage?: string | null;
  play_duration?: string | null;
  category?: string | null;
}

export interface ActivityFilters {
  available_age_ranges: string[];
  available_stages: string[];
  available_categories: string[];
}

export interface CreateActivityLogPayload {
  activity_id: string;
  status: string;
}

// ─── Library ─────────────────────────────────────────────────────────────────

export interface LibraryResourceResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  age_group?: string | null;
}

export interface LibraryResourceDetailResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  age_group?: string | null;
  full_content?: string | null;
  tips?: string | null;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface ReportResponse {
  id: string;
  title: string;
  period_type: string;
  start_date: string;
  end_date: string;
  total_scripts: number;
  positive_pct?: number | null;
  growth_rate?: number | null;
  new_milestones: number;
}

export interface ScheduleResponse {
  id: string;
  frequency: ScheduleFrequency;
  email: string;
  active: boolean;
  created_at: string;
}

export interface GenerateReportPayload {
  period_type: ReportPeriod;
  title?: string;
}

export interface CreateSchedulePayload {
  frequency: ScheduleFrequency;
  email: string;
}

export interface UpdateSchedulePayload {
  frequency?: ScheduleFrequency;
  email?: string;
  active?: boolean;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface ProfileResponse {
  id: string;
  child_name?: string | null;
  child_age?: number | null;
  avatar_url?: string | null;
  role: string;
  created_at: string;
}

export interface UpdateProfilePayload {
  child_name?: string;
  child_age?: number;
  avatar_url?: string;
}

// ─── API client ──────────────────────────────────────────────────────────────

export const api = {
  // ── Auth / User ────────────────────────────────────────────────────────────

  getNotificationCount() {
    return request<{ unread_count: number }>(
      "/api/v1/dashboard/notification-count",
    );
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────

  getDashboard() {
    return request<DashboardData>("/api/v1/dashboard");
  },

  // ── Scripts ────────────────────────────────────────────────────────────────

  getScripts(params: Record<string, string | number>) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]) as [string, string][],
    ).toString();
    return request<{ items: ScriptResponse[]; pagination: Pagination }>(
      `/api/v1/scripts?${qs}`,
    );
  },

  createScript(data: CreateScriptPayload) {
    return request<ScriptResponse>("/api/v1/scripts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateScript(id: string, data: UpdateScriptPayload) {
    return request<ScriptResponse>(`/api/v1/scripts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteScript(id: string) {
    return request<void>(`/api/v1/scripts/${id}`, { method: "DELETE" });
  },

  // ── Progress ───────────────────────────────────────────────────────────────

  getProgressSummary(period: string) {
    return request<ProgressSummary>(
      `/api/v1/progress/summary?period=${period}`,
    );
  },

  getProgressWeekly() {
    return request<{
      chart: ChartData;
      recent_milestones: RecentMilestone[];
    }>("/api/v1/progress/weekly");
  },

  getProgressEmotions(period: string) {
    return request<{ chart: ChartData }>(
      `/api/v1/progress/emotions?period=${period}`,
    );
  },

  getProgressTrends(trendPeriod: string, months: number) {
    return request<{ chart: TrendsChart }>(
      `/api/v1/progress/trends?period=${trendPeriod}&months=${months}`,
    );
  },

  // ── Milestones ─────────────────────────────────────────────────────────────

  getMilestones(params: Record<string, string | number>) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]) as [string, string][],
    ).toString();
    return request<{ items: MilestoneResponse[]; pagination: Pagination }>(
      `/api/v1/milestones?${qs}`,
    );
  },

  createMilestone(data: CreateMilestonePayload) {
    return request<MilestoneResponse>("/api/v1/milestones", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // ── Activities ─────────────────────────────────────────────────────────────

  getActivities(params: Record<string, string | number>) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]) as [string, string][],
    ).toString();
    return request<{
      items: ActivityResponse[];
      filters: ActivityFilters;
      pagination: Pagination;
    }>(`/api/v1/activities?${qs}`);
  },

  createActivityLog(data: CreateActivityLogPayload) {
    return request<unknown>("/api/v1/activity-logs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // ── Library ────────────────────────────────────────────────────────────────

  getLibrary() {
    return request<{ items: LibraryResourceResponse[] }>("/api/v1/library");
  },

  getLibraryResource(id: string) {
    return request<LibraryResourceDetailResponse>(`/api/v1/library/${id}`);
  },

  // ── Reports ────────────────────────────────────────────────────────────────

  getReportHistory(params: Record<string, string | number>) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]) as [string, string][],
    ).toString();
    return request<{ items: ReportResponse[]; pagination: Pagination }>(
      `/api/v1/reports/history?${qs}`,
    );
  },

  generateReport(data: GenerateReportPayload) {
    return request<ReportResponse>("/api/v1/reports/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getReportDownloadUrl(reportId: string) {
    return request<{ download_url: string }>(
      `/api/v1/reports/${reportId}/download`,
    );
  },

  shareReportEmail(reportId: string, email: string) {
    return request<void>(`/api/v1/reports/${reportId}/share-email`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  getReportSchedules() {
    return request<{ items: ScheduleResponse[] }>("/api/v1/reports/schedules");
  },

  createReportSchedule(data: CreateSchedulePayload) {
    return request<ScheduleResponse>("/api/v1/reports/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateReportSchedule(id: string, data: UpdateSchedulePayload) {
    return request<ScheduleResponse>(`/api/v1/reports/schedules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteReportSchedule(id: string) {
    return request<void>(`/api/v1/reports/schedules/${id}`, {
      method: "DELETE",
    });
  },

  // ── Notifications ──────────────────────────────────────────────────────────

  getNotifications(params: Record<string, string | number>) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]) as [string, string][],
    ).toString();
    return request<{
      notifications: NotificationResponse[];
      pagination: Pagination;
    }>(`/api/v1/notifications?${qs}`);
  },

  markNotificationRead(id: string) {
    return request<void>(`/api/v1/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  // ── Profile ────────────────────────────────────────────────────────────────

  getProfile() {
    return request<ProfileResponse>("/api/v1/profile");
  },

  updateProfile(data: UpdateProfilePayload) {
    return request<ProfileResponse>("/api/v1/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
