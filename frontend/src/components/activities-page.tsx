"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api, type ActivityResponse, type ActivityFilters } from "@/lib/api";
import { useAuth, isApiError } from "@/lib/auth-context";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Puzzle,
  Clock,
  Play,
  Star,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Baby,
} from "lucide-react";
import { toast } from "sonner";

export function ActivitiesPage() {
  const { isAuthenticated } = useAuth();

  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [filters, setFilters] = useState<ActivityFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgeRange, setSelectedAgeRange] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Detail modal
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityResponse | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [startingActivity, setStartingActivity] = useState(false);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: 12,
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedAgeRange) params.age_range = selectedAgeRange;
      if (selectedStage) params.stage = selectedStage;
      if (selectedCategory) params.category = selectedCategory;

      const response = await api.getActivities(params);
      setActivities(response.data.items);
      setFilters(response.data.filters);
      setTotalPages(response.data.pagination.total_pages);
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedAgeRange, selectedStage, selectedCategory]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleStartActivity = async () => {
    if (!selectedActivity || !isAuthenticated) return;
    setStartingActivity(true);
    try {
      await api.createActivityLog({
        activity_id: selectedActivity.id,
        status: "started",
      });
      toast.success("Activity started! Have fun!");
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setStartingActivity(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedAgeRange("");
    setSelectedStage("");
    setSelectedCategory("");
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery || selectedAgeRange || selectedStage || selectedCategory;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Activities</h1>
        <p className="text-muted-foreground">
          Browse therapeutic activities for your child
        </p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {filters && (
            <div className="flex flex-wrap gap-2">
              {filters.available_age_ranges.map((ar) => (
                <Badge
                  key={ar}
                  variant={selectedAgeRange === ar ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedAgeRange(selectedAgeRange === ar ? "" : ar);
                    setPage(1);
                  }}
                >
                  <Baby className="mr-1 h-3 w-3" />
                  {ar}
                </Badge>
              ))}
            </div>
          )}

          {filters && (
            <div className="flex flex-wrap gap-2">
              {filters.available_stages.map((stage) => (
                <Badge
                  key={stage}
                  variant={selectedStage === stage ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedStage(selectedStage === stage ? "" : stage);
                    setPage(1);
                  }}
                >
                  <Star className="mr-1 h-3 w-3" />
                  {stage}
                </Badge>
              ))}
            </div>
          )}

          {filters && (
            <div className="flex flex-wrap gap-2">
              {filters.available_categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(selectedCategory === cat ? "" : cat);
                    setPage(1);
                  }}
                >
                  <BookOpen className="mr-1 h-3 w-3" />
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />
              Clear all filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Activities Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Puzzle className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">No activities found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <Card
                key={activity.id}
                className="cursor-pointer group hover:shadow-md transition-shadow overflow-hidden"
                onClick={() => {
                  setSelectedActivity(activity);
                  setShowDetail(true);
                }}
              >
                {activity.image_url && (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={activity.image_url}
                      alt={activity.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {activity.age_range && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Baby className="mr-0.5 h-2.5 w-2.5" />
                        {activity.age_range}
                      </Badge>
                    )}
                    {activity.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {activity.category}
                      </Badge>
                    )}
                    {activity.play_duration && (
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="mr-0.5 h-2.5 w-2.5" />
                        {activity.play_duration}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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

      {/* Activity Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedActivity.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Activity details
                </DialogDescription>
              </DialogHeader>

              {selectedActivity.image_url && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={selectedActivity.image_url}
                    alt={selectedActivity.title}
                    className="w-full object-cover"
                  />
                </div>
              )}

              <p className="text-muted-foreground leading-relaxed">
                {selectedActivity.description}
              </p>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {selectedActivity.age_range && (
                  <Badge variant="secondary">
                    <Baby className="mr-1 h-3 w-3" />
                    {selectedActivity.age_range}
                  </Badge>
                )}
                {selectedActivity.stage && (
                  <Badge variant="secondary">
                    <Star className="mr-1 h-3 w-3" />
                    {selectedActivity.stage}
                  </Badge>
                )}
                {selectedActivity.category && (
                  <Badge variant="secondary">
                    <BookOpen className="mr-1 h-3 w-3" />
                    {selectedActivity.category}
                  </Badge>
                )}
                {selectedActivity.play_duration && (
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" />
                    {selectedActivity.play_duration}
                  </Badge>
                )}
              </div>

              {isAuthenticated && (
                <Button
                  className="w-full mt-2"
                  onClick={handleStartActivity}
                  disabled={startingActivity}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {startingActivity ? "Starting..." : "Start Activity"}
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
