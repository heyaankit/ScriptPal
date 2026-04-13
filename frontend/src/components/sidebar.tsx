"use client";

import React, { useState } from "react";
import {
  LogOut,
  Menu,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { NAV_CONFIG } from "@/lib/nav-config";
import type { NavItem } from "@/lib/enums";

interface SidebarProps {
  currentPage: NavItem;
  onNavigate: (page: NavItem) => void;
  unreadCount: number;
}

function SidebarContent({
  currentPage,
  onNavigate,
  unreadCount,
  onLogout,
}: SidebarProps & { onLogout: () => void }) {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Heart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">ScriptPal</h1>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Autism Support
          </p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {NAV_CONFIG.map((item) => {
            // Hide non-public items when not authenticated
            if (!isAuthenticated && !item.public) return null;

            const Icon = item.icon;
            const isActive = currentPage === item.key;

            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.key === "notifications" && unreadCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-[20px] justify-center rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User Section */}
      {isAuthenticated && user && (
        <div className="p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user.name?.charAt(0)?.toUpperCase() ||
                  user.phone?.slice(-2) ||
                  "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.phone}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const { logout } = useAuth();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r bg-card">
      <SidebarContent
        {...props}
        onLogout={() => {
          logout();
          props.onNavigate("dashboard");
        }}
      />
    </aside>
  );
}

export function MobileSidebar(props: SidebarProps) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarContent
          {...props}
          onLogout={() => {
            logout();
            props.onNavigate("dashboard");
            setOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

export function MobileBottomNav(props: SidebarProps) {
  const { isAuthenticated } = useAuth();

  const mobileNavItems = NAV_CONFIG.filter(
    (item) => item.public || isAuthenticated
  ).slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-lg lg:hidden">
      <div className="flex items-center justify-around py-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = props.currentPage === item.key;

          return (
            <button
              key={item.key}
              onClick={() => props.onNavigate(item.key)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors min-w-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
