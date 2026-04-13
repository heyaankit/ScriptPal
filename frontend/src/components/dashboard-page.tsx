"use client";

import React, { useEffect, useState } from "react";
import { api, type DashboardData } from "@/lib/api";
import { useAuth, isApiError } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lightbulb,
  FileText,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { EMOTIONAL_STATE_OPTIONS } from "@/lib/enums";
import { toast } from "sonner";

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getDashboard();
      setData(response.data);
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError("Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={loadDashboard}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {data?.greeting || `Welcome back${user?.name ? `, ${user.name}` : ""}`}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {data?.sub_message || "Here's what's happening today."}
          </p>
        </div>
        <Button
          onClick={() => onNavigate("scripts")}
          className="w-full sm:w-auto"
        >
          <FileText className="mr-2 h-4 w-4" />
          New Script
        </Button>
      </div>

      {/* Daily Suggestion */}
      {data?.daily_suggestion && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-teal-500/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  Daily Suggestion
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {data.daily_suggestion?.text || data.daily_suggestion?.activity_name || "Try something new today!"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Recent Scripts */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Recent Scripts
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {data?.recent_scripts?.length || 0}
              </Badge>
            </div>
            <CardDescription>Your latest therapy scripts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[240px]">
              <div className="space-y-1 px-4 pb-2">
                {data?.recent_scripts && data.recent_scripts.length > 0 ? (
                  data.recent_scripts.map((script) => {
                    const emotion = EMOTIONAL_STATE_OPTIONS.find(
                      (e) => e.value === script.emotional_state
                    );
                    return (
                      <div
                        key={script.id}
                        className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            script.emotional_state === "happy"
                              ? "bg-yellow-400"
                              : script.emotional_state === "excited"
                                ? "bg-orange-400"
                                : script.emotional_state === "sad"
                                  ? "bg-blue-400"
                                  : script.emotional_state === "anxious"
                                    ? "bg-purple-400"
                                    : script.emotional_state === "angry"
                                      ? "bg-red-400"
                                      : "bg-gray-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {script.script_text}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {emotion && (
                              <span className="text-[10px] text-muted-foreground">
                                {emotion.label}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                          {script.time_ago}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No scripts yet</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onNavigate("scripts")}
                    >
                      Create your first script
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
            {data?.recent_scripts && data.recent_scripts.length > 0 && (
              <div className="border-t p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => onNavigate("scripts")}
                >
                  View All Scripts
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Insight */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Weekly Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data?.weekly_insight?.pattern_found ||
                "Start tracking your scripts to see weekly insights here."}
            </p>
            {data?.weekly_insight && data.weekly_insight.scripts_this_week > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">{data.weekly_insight.scripts_this_week}</span> scripts this week
                {data.weekly_insight.most_repeated && (
                  <> &middot; Most repeated: &ldquo;{data.weekly_insight.most_repeated}&rdquo;</>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate("activities")}
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Browse Activities
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate("progress")}
            >
              <TrendingUp className="mr-2 h-4 w-4 text-primary" />
              View Progress
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate("milestones")}
            >
              <TrendingUp className="mr-2 h-4 w-4 text-primary" />
              Add Milestone
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate("library")}
            >
              <TrendingUp className="mr-2 h-4 w-4 text-primary" />
              Resource Library
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
