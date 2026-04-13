"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api, type NotificationResponse } from "@/lib/api";
import { isApiError } from "@/lib/auth-context";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BellOff,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertCircle,
  Star,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  achievement: Star,
  report: FileText,
  reminder: Bell,
  alert: AlertCircle,
  info: Info,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  achievement: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  report: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  reminder: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  alert: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getNotifications({ page, page_size: 20 });
      setNotifications(response.data.notifications);
      setTotalPages(response.data.pagination.total_pages);
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    setMarkingRead(id);
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setMarkingRead(null);
    }
  };

  // Group by date
  const groupedNotifications = notifications.reduce(
    (groups, notification) => {
      const date = notification.created_at.split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(notification);
      return groups;
    },
    {} as Record<string, NotificationResponse[]>
  );

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on your child&apos;s progress
          </p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Badge variant="secondary">
            {notifications.filter((n) => !n.read).length} unread
          </Badge>
        )}
      </div>

      {/* Notifications List */}
      {Object.keys(groupedNotifications).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BellOff className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;re all caught up!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
              </h3>
              <div className="space-y-2">
                {items.map((notification) => {
                  const Icon =
                    NOTIFICATION_ICONS[notification.type] || Info;
                  const colorClass =
                    NOTIFICATION_COLORS[notification.type] ||
                    NOTIFICATION_COLORS.info;

                  return (
                    <Card
                      key={notification.id}
                      className={cn(
                        "transition-all cursor-pointer",
                        !notification.read &&
                          "bg-primary/5 border-primary/10"
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          handleMarkRead(notification.id);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
                              colorClass
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4
                                className={cn(
                                  "text-sm",
                                  !notification.read && "font-semibold"
                                )}
                              >
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkRead(notification.id);
                              }}
                              disabled={markingRead === notification.id}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
