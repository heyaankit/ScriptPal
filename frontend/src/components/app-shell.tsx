"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Sidebar,
  MobileSidebar,
  MobileBottomNav,
} from "./sidebar";
import {
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { NavItem } from "@/lib/enums";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  currentPage: NavItem;
  onNavigate: (page: NavItem) => void;
  unreadCount: number;
}

export function AppShell({
  children,
  currentPage,
  onNavigate,
  unreadCount,
}: AppShellProps) {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate("dashboard");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        unreadCount={unreadCount}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4 lg:px-6">
          <MobileSidebar
            currentPage={currentPage}
            onNavigate={onNavigate}
            unreadCount={unreadCount}
          />

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => onNavigate("notifications")}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 h-4 min-w-[16px] justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>

                <div className="hidden sm:flex items-center gap-2 ml-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() ||
                        user?.phone?.slice(-2) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden md:inline">
                    {user?.name || "User"}
                  </span>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-4">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && (
        <MobileBottomNav
          currentPage={currentPage}
          onNavigate={onNavigate}
          unreadCount={unreadCount}
        />
      )}
    </div>
  );
}
