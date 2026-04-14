"use client";

import {
  LayoutDashboard,
  FileText,
  Puzzle,
  TrendingUp,
  Trophy,
  BarChart3,
  Bell,
  UserCircle,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { NavItem } from "@/lib/enums";

interface NavItemConfig {
  key: NavItem;
  label: string;
  icon: LucideIcon;
  public: boolean;
}

export const NAV_CONFIG: NavItemConfig[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    public: false,
  },
  {
    key: "scripts",
    label: "Scripts",
    icon: FileText,
    public: false,
  },
  {
    key: "activities",
    label: "Activities",
    icon: Puzzle,
    public: true,
  },
  {
    key: "progress",
    label: "Progress",
    icon: TrendingUp,
    public: false,
  },
  {
    key: "milestones",
    label: "Milestones",
    icon: Trophy,
    public: false,
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    public: false,
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
    public: false,
  },
  {
    key: "profile",
    label: "Profile",
    icon: UserCircle,
    public: false,
  },
  {
    key: "library",
    label: "Library",
    icon: BookOpen,
    public: true,
  },
];
