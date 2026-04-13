"use client";

import React, { useEffect, useState } from "react";
import {
  api,
  type LibraryResourceResponse,
  type LibraryResourceDetailResponse,
} from "@/lib/api";
import { isApiError } from "@/lib/auth-context";
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
  BookOpen,
  Lightbulb,
  Users,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  "Communication": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Social Skills": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  "Behavior": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Daily Living": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Sensory": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Academic": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Play": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Communication": "💬",
  "Social Skills": "🤝",
  "Behavior": "🧠",
  "Daily Living": "🏠",
  "Sensory": "🎨",
  "Academic": "📚",
  "Play": "🎮",
};

export function LibraryPage() {
  const [resources, setResources] = useState<LibraryResourceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Detail dialog
  const [selectedResource, setSelectedResource] =
    useState<LibraryResourceDetailResponse | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await api.getLibrary();
      setResources(response.data.items);
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (resource: LibraryResourceResponse) => {
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const response = await api.getLibraryResource(resource.id);
      setSelectedResource(response.data);
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  // Get unique categories
  const categories = Array.from(
    new Set(resources.map((r) => r.category).filter(Boolean))
  );

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      !searchQuery ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Resource Library</h1>
        <p className="text-muted-foreground">
          Helpful resources for autism support
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          className="pl-9 max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("")}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {CATEGORY_ICONS[cat] || "📄"} {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">No resources found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => {
            const categoryColor =
              CATEGORY_COLORS[resource.category] ||
              "bg-gray-100 text-gray-700";
            const categoryIcon =
              CATEGORY_ICONS[resource.category] || "📄";

            return (
              <Card
                key={resource.id}
                className="cursor-pointer group hover:shadow-md transition-shadow overflow-hidden"
                onClick={() => openDetail(resource)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
                      {categoryIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {resource.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={cn("mt-1.5 text-[10px]", categoryColor)}
                      >
                        {resource.category}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {resource.description}
                      </p>
                      {resource.age_group && (
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {resource.age_group}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detailLoading ? (
            <div className="py-8 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : selectedResource ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {CATEGORY_ICONS[selectedResource.category] || "📄"}{" "}
                  {selectedResource.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Resource details
                </DialogDescription>
              </DialogHeader>

              <Badge
                variant="secondary"
                className={cn(
                  CATEGORY_COLORS[selectedResource.category] ||
                    "bg-gray-100 text-gray-700"
                )}
              >
                {selectedResource.category}
              </Badge>

              {selectedResource.age_group && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Age Group: {selectedResource.age_group}
                </p>
              )}

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedResource.description}
                </p>
              </div>

              {selectedResource.full_content && (
                <div>
                  <h4 className="font-semibold mb-2">Content</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedResource.full_content}
                  </p>
                </div>
              )}

              {selectedResource.tips && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-1">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Tips
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedResource.tips}
                  </p>
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
