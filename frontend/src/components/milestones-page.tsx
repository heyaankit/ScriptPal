"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api, type MilestoneResponse } from "@/lib/api";
import { isApiError } from "@/lib/auth-context";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Trophy,
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MILESTONE_ICONS = [
  { value: "🏆", label: "Trophy" },
  { value: "⭐", label: "Star" },
  { value: "🎯", label: "Target" },
  { value: "🎉", label: "Party" },
  { value: "💎", label: "Diamond" },
  { value: "🌟", label: "Shining Star" },
  { value: "🎪", label: "Circus" },
  { value: "🎨", label: "Art" },
  { value: "📚", label: "Book" },
  { value: "🎵", label: "Music" },
];

export function MilestonesPage() {
  const [milestones, setMilestones] = useState<MilestoneResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    icon: "🏆",
    achieved_on: new Date().toISOString().split("T")[0],
  });
  const [formLoading, setFormLoading] = useState(false);

  const loadMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getMilestones({ page, page_size: 20 });
      setMilestones(response.data.items);
      setTotalPages(response.data.pagination.total_pages);
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const handleCreate = async () => {
    if (!formData.title || !formData.achieved_on) {
      toast.error("Please fill in all required fields");
      return;
    }
    setFormLoading(true);
    try {
      await api.createMilestone(formData);
      toast.success("Milestone created successfully!");
      setShowCreateDialog(false);
      setFormData({
        title: "",
        icon: "🏆",
        achieved_on: new Date().toISOString().split("T")[0],
      });
      loadMilestones();
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Milestones</h1>
          <p className="text-muted-foreground">
            Celebrate achievements and progress
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : milestones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Trophy className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">No milestones yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Start recording your child&apos;s achievements!
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Milestone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg border-2 border-card">
                    {milestone.icon || "🏆"}
                  </div>

                  {/* Content */}
                  <Card className="flex-1 ml-2">
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {milestone.achieved_on}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

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
        </>
      )}

      {/* Create Milestone Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Milestone</DialogTitle>
            <DialogDescription>
              Record a new achievement or milestone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Milestone Title *</Label>
              <Input
                placeholder="e.g., First complete sentence"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {MILESTONE_ICONS.map((icon) => (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, icon: icon.value })
                    }
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors",
                      formData.icon === icon.value
                        ? "bg-primary/10 ring-2 ring-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    {icon.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date Achieved *</Label>
              <Input
                type="date"
                value={formData.achieved_on}
                onChange={(e) =>
                  setFormData({ ...formData, achieved_on: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
