"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { AuthPage } from "@/components/auth-page";
import { DashboardPage } from "@/components/dashboard-page";
import { ScriptsPage } from "@/components/scripts-page";
import { ActivitiesPage } from "@/components/activities-page";
import { ProgressPage } from "@/components/progress-page";
import { ReportsPage } from "@/components/reports-page";
import { MilestonesPage } from "@/components/milestones-page";
import { NotificationsPage } from "@/components/notifications-page";
import { ProfilePage } from "@/components/profile-page";
import { LibraryPage } from "@/components/library-page";
import type { NavItem } from "@/lib/enums";

const PUBLIC_PAGES: NavItem[] = ["activities", "library"];

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavItem>("dashboard");
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotificationCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.getNotificationCount();
      setUnreadCount(response.data.unread_count);
    } catch {
      // Silently fail for notification count
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotificationCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotificationCount]);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page as NavItem);
  }, []);

  // Show auth page if not authenticated and trying to access protected page
  if (!isLoading && !isAuthenticated && !PUBLIC_PAGES.includes(currentPage)) {
    return <AuthPage />;
  }

  // If on auth-required page but loading, show nothing
  if (isLoading && !PUBLIC_PAGES.includes(currentPage)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // For authenticated users or public pages, show app shell
  if (isAuthenticated || PUBLIC_PAGES.includes(currentPage)) {
    return (
      <AppShell
        currentPage={currentPage}
        onNavigate={handleNavigate}
        unreadCount={unreadCount}
      >
        <PageRenderer
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
      </AppShell>
    );
  }

  // Default: show auth page
  return <AuthPage />;
}

function PageRenderer({
  currentPage,
  onNavigate,
}: {
  currentPage: NavItem;
  onNavigate: (page: string) => void;
}) {
  switch (currentPage) {
    case "dashboard":
      return <DashboardPage onNavigate={onNavigate} />;
    case "scripts":
      return <ScriptsPage />;
    case "activities":
      return <ActivitiesPage />;
    case "progress":
      return <ProgressPage />;
    case "milestones":
      return <MilestonesPage />;
    case "reports":
      return <ReportsPage />;
    case "notifications":
      return <NotificationsPage />;
    case "profile":
      return <ProfilePage onNavigate={onNavigate} />;
    case "library":
      return <LibraryPage />;
    default:
      return <DashboardPage onNavigate={onNavigate} />;
  }
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
