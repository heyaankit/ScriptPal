"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api, type ProgressSummary, type ChartData, type TrendsChart, type RecentMilestone } from "@/lib/api";
import { isApiError } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  FileText,
  Smile,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Calendar,
} from "lucide-react";
import { REPORT_PERIOD_OPTIONS } from "@/lib/enums";
import { toast } from "sonner";

const EMOTION_COLORS: Record<string, string> = {
  happy: "#eab308",
  excited: "#f97316",
  neutral: "#6b7280",
  sad: "#3b82f6",
  anxious: "#a855f7",
  angry: "#ef4444",
};

const MILESTONE_ICONS: Record<string, string> = {
  celebrate: "🎉",
  star: "⭐",
  trophy: "🏆",
};

function getMilestoneIcon(icon: string | undefined) {
  return icon && MILESTONE_ICONS[icon] ? MILESTONE_ICONS[icon] : "🏆";
}

export function ProgressPage() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("week");
  const [trendPeriod, setTrendPeriod] = useState<"month" | "quarter">("month");

  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [weeklyChart, setWeeklyChart] = useState<ChartData | null>(null);
  const [emotionChart, setEmotionChart] = useState<ChartData | null>(null);
  const [trendsChart, setTrendsChart] = useState<TrendsChart | null>(null);
  const [recentMilestones, setRecentMilestones] = useState<RecentMilestone[]>([]);

  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, weeklyRes, emotionRes, trendsRes] = await Promise.all([
        api.getProgressSummary(period),
        api.getProgressWeekly(),
        api.getProgressEmotions(period),
        api.getProgressTrends(trendPeriod, 6),
      ]);

      setSummary(summaryRes.data);
      setWeeklyChart(weeklyRes.data.chart);
      setEmotionChart(emotionRes.data.chart);
      setTrendsChart(trendsRes.data.chart);
      setRecentMilestones(weeklyRes.data.recent_milestones || []);
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [period, trendPeriod]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const weeklyData = weeklyChart
    ? weeklyChart.labels.map((label, i) => ({
        label,
        value: weeklyChart.values[i],
      }))
    : [];

  const emotionData = emotionChart
    ? emotionChart.labels.map((label, i) => ({
        label,
        value: emotionChart.values[i],
        color: EMOTION_COLORS[label.toLowerCase()] || "#10b981",
      }))
    : [];

  const trendsData = trendsChart
    ? trendsChart.labels.map((label, i) => ({
        label,
        scripts: trendsChart.scripts[i],
        positivePct: trendsChart.positive_pct[i],
        growthRate: trendsChart.growth_rate[i],
      }))
    : [];

  const chartConfig = {
    value: { label: "Scripts", color: "#10b981" },
    scripts: { label: "Scripts", color: "#10b981" },
    positivePct: { label: "Positive %", color: "#eab308" },
    growthRate: { label: "Growth Rate", color: "#14b8a6" },
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Progress</h1>
          <p className="text-muted-foreground">
            Track your therapy journey
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Scripts</p>
                <p className="text-3xl font-bold mt-1">
                  {summary?.total_scripts ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-3xl font-bold mt-1 flex items-center gap-1">
                  {summary?.growth_rate !== undefined
                    ? `${summary.growth_rate > 0 ? "+" : ""}${summary.growth_rate}%`
                    : "N/A"}
                  {summary?.growth_rate !== undefined &&
                    summary.growth_rate > 0 && (
                      <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                    )}
                  {summary?.growth_rate !== undefined &&
                    summary.growth_rate < 0 && (
                      <ArrowDownRight className="h-5 w-5 text-red-500" />
                    )}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Positive Emotions
                </p>
                <p className="text-3xl font-bold mt-1">
                  {summary?.positive_emotions_pct !== undefined
                    ? `${summary.positive_emotions_pct}%`
                    : "N/A"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <Smile className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      {weeklyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {weeklyChart?.title || "Weekly Scripts"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="label"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Emotion Distribution & Trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Emotion Pie Chart */}
        {emotionData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {emotionChart?.title || "Emotion Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <PieChart>
                  <Pie
                    data={emotionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ label, percent }) =>
                      `${label} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                    fontSize={11}
                  >
                    {emotionData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Trends Line Chart */}
        {trendsData.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  {trendsChart?.title || "Trends Over Time"}
                </CardTitle>
              </div>
              <Select
                value={trendPeriod}
                onValueChange={(v) =>
                  setTrendPeriod(v as "month" | "quarter")
                }
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <LineChart data={trendsData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="label"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="scripts"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#10b981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="positivePct"
                    stroke="#eab308"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#eab308" }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Milestones */}
      {recentMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Recent Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">
                    {getMilestoneIcon(milestone.icon)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{milestone.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {milestone.achieved_on}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
