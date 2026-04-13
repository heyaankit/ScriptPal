"use client";

import React, { useEffect, useState } from "react";
import { api, type ProfileResponse } from "@/lib/api";
import { useAuth, isApiError } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  Mail,
  Shield,
  Calendar,
  Baby,
  Save,
  Loader2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    child_name: "",
    child_age: "",
    avatar_url: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await api.getProfile();
      setProfile(response.data);
      setFormData({
        child_name: response.data.child_name || "",
        child_age: response.data.child_age?.toString() || "",
        avatar_url: response.data.avatar_url || "",
      });
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const parsedAge = formData.child_age ? parseInt(formData.child_age, 10) : undefined;
    if (parsedAge !== undefined && (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 18)) {
      toast.error("Please enter a valid age between 1 and 18");
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile({
        child_name: formData.child_name || undefined,
        child_age: parsedAge,
        avatar_url: formData.avatar_url || undefined,
      });
      toast.success("Profile updated successfully!");
      setEditing(false);
      loadProfile();
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate("dashboard");
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const displayName = profile?.child_name || user?.name || "User";
  const displayRole = profile?.role || user?.role || "user";

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account and child information
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-primary/10">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-muted-foreground">
                {displayRole.charAt(0).toUpperCase() + displayRole.slice(1)}
              </p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <Badge variant="secondary" className="text-xs">
                  <Phone className="mr-1 h-3 w-3" />
                  {user?.phone || profile?.id}
                </Badge>
                {user?.email && (
                  <Badge variant="secondary" className="text-xs">
                    <Mail className="mr-1 h-3 w-3" />
                    {user.email}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  <Calendar className="mr-1 h-3 w-3" />
                  Joined {profile?.created_at?.split("T")[0] || "N/A"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Child Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Baby className="h-4 w-4 text-primary" />
                Child Information
              </CardTitle>
              <CardDescription>
                Information about the child you are supporting
              </CardDescription>
            </div>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      child_name: profile?.child_name || "",
                      child_age: profile?.child_age?.toString() || "",
                      avatar_url: profile?.avatar_url || "",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Child&apos;s Name</Label>
                {editing ? (
                  <Input
                    placeholder="Enter child's name"
                    value={formData.child_name}
                    onChange={(e) =>
                      setFormData({ ...formData, child_name: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-sm py-2">
                    {profile?.child_name || (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Child&apos;s Age</Label>
                {editing ? (
                  <Input
                    type="number"
                    placeholder="Enter age"
                    value={formData.child_age}
                    onChange={(e) =>
                      setFormData({ ...formData, child_age: e.target.value })
                    }
                    min={1}
                    max={18}
                  />
                ) : (
                  <p className="text-sm py-2">
                    {profile?.child_age
                      ? `${profile.child_age} years old`
                      : (
                        <span className="text-muted-foreground">
                          Not set
                        </span>
                      )}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Avatar URL</Label>
              {editing ? (
                <Input
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar_url: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm py-2">
                  {profile?.avatar_url || (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-sm font-mono">{profile?.id || user?.id}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Phone</span>
              <span className="text-sm">{user?.phone || "N/A"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm">{user?.email || "N/A"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary">{displayRole}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
