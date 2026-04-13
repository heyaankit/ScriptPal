"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api, type ScriptResponse, type Pagination } from "@/lib/api";
import { isApiError } from "@/lib/auth-context";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  CONTEXT_OPTIONS,
  EMOTIONAL_STATE_OPTIONS,
  SOURCE_OPTIONS,
  FREQUENCY_OPTIONS,
  type Context,
  type EmotionalState,
  type Source,
  type Frequency,
} from "@/lib/enums";

export function ScriptsPage() {
  const [scripts, setScripts] = useState<ScriptResponse[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [contextFilter, setContextFilter] = useState<string>("all");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedScript, setSelectedScript] = useState<ScriptResponse | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form - using any to avoid strict type issues with empty string defaults
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>({
    script_text: "",
    context: "",
    emotional_state: "",
    source: "",
    frequency: "",
    meaning: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      script_text: "",
      context: "",
      emotional_state: "",
      source: "",
      frequency: "",
      meaning: "",
      notes: "",
    });
  };

  const loadScripts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: 10,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (contextFilter && contextFilter !== "all")
        params.context = contextFilter;
      if (emotionFilter && emotionFilter !== "all")
        params.emotional_state = emotionFilter;
      if (frequencyFilter && frequencyFilter !== "all")
        params.frequency = frequencyFilter;

      const response = await api.getScripts(params);
      setScripts(response.data.items);
      setPagination(response.data.pagination);
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [page, contextFilter, emotionFilter, frequencyFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  const handleCreate = async () => {
    if (!formData.script_text || !formData.context || !formData.emotional_state || !formData.source || !formData.frequency) {
      toast.error("Please fill in all required fields");
      return;
    }
    setFormLoading(true);
    try {
      await api.createScript({
        script_text: formData.script_text,
        context: formData.context as Context,
        emotional_state: formData.emotional_state as EmotionalState,
        source: formData.source as Source,
        frequency: formData.frequency as Frequency,
        meaning: formData.meaning || undefined,
        notes: formData.notes || undefined,
      });
      toast.success("Script created successfully!");
      setShowCreateDialog(false);
      resetForm();
      loadScripts();
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedScript) return;
    setFormLoading(true);
    try {
      await api.updateScript(selectedScript.id, {
        script_text: formData.script_text || undefined,
        context: formData.context || undefined,
        emotional_state: formData.emotional_state || undefined,
        source: formData.source || undefined,
        frequency: formData.frequency || undefined,
        meaning: formData.meaning || undefined,
        notes: formData.notes || undefined,
      });
      toast.success("Script updated successfully!");
      setShowEditDialog(false);
      setSelectedScript(null);
      resetForm();
      loadScripts();
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedScript) return;
    setFormLoading(true);
    try {
      await api.deleteScript(selectedScript.id);
      toast.success("Script deleted successfully!");
      setShowDeleteDialog(false);
      setSelectedScript(null);
      loadScripts();
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (script: ScriptResponse) => {
    setSelectedScript(script);
    setFormData({
      script_text: script.script_text,
      context: script.context,
      emotional_state: script.emotional_state,
      source: script.source,
      frequency: script.frequency,
      meaning: script.meaning || "",
      notes: script.notes || "",
    });
    setShowEditDialog(true);
  };

  const openDelete = (script: ScriptResponse) => {
    setSelectedScript(script);
    setShowDeleteDialog(true);
  };

  const getEmotionBadgeColor = (emotion: string) => {
    const opt = EMOTIONAL_STATE_OPTIONS.find((e) => e.value === emotion);
    return opt?.color || "";
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Scripts</h1>
          <p className="text-muted-foreground">
            Manage your therapy scripts
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Script
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={contextFilter} onValueChange={(v) => { setContextFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contexts</SelectItem>
                {CONTEXT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={emotionFilter} onValueChange={(v) => { setEmotionFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Emotion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Emotions</SelectItem>
                {EMOTIONAL_STATE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={frequencyFilter} onValueChange={(v) => { setFrequencyFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequencies</SelectItem>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setContextFilter("all");
                setEmotionFilter("all");
                setFrequencyFilter("all");
                setPage(1);
              }}
              className="text-muted-foreground"
            >
              Clear Filters
            </Button>

            <div className="ml-auto flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="context">Context</SelectItem>
                  <SelectItem value="emotional_state">Emotion</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title="Toggle sort order"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scripts List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : scripts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">No scripts found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first therapy script to get started.
            </p>
            <Button
              className="mt-4"
              onClick={() => { resetForm(); setShowCreateDialog(true); }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Script
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {scripts.map((script) => (
            <Card key={script.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-relaxed">
                      {script.script_text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {script.context}
                      </Badge>
                      <Badge className={`text-xs ${getEmotionBadgeColor(script.emotional_state)}`}>
                        {script.emotional_state}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {script.frequency}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {script.source}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {script.time_ago}
                      </span>
                    </div>
                    {(script.meaning || script.notes) && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                        {script.meaning || script.notes}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(script)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => openDelete(script)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
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
                Page {page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= pagination.total_pages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Script Dialog */}
      <ScriptFormDialog
        open={showCreateDialog || showEditDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          resetForm();
          setSelectedScript(null);
        }}
        onSubmit={showEditDialog ? handleEdit : handleCreate}
        formData={formData}
        setFormData={setFormData}
        loading={formLoading}
        title={showEditDialog ? "Edit Script" : "Create New Script"}
        description={
          showEditDialog
            ? "Update your therapy script details."
            : "Add a new therapy script for tracking."
        }
        submitLabel={showEditDialog ? "Save Changes" : "Create Script"}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Script</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this script? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Script Form Dialog Component
function ScriptFormDialog({
  open,
  onClose,
  onSubmit,
  formData,
  setFormData,
  loading,
  title,
  description,
  submitLabel,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: {
    script_text: string;
    context: string;
    emotional_state: string;
    source: string;
    frequency: string;
    meaning: string;
    notes: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      script_text: string;
      context: string;
      emotional_state: string;
      source: string;
      frequency: string;
      meaning: string;
      notes: string;
    }>
  >;
  loading: boolean;
  title: string;
  description: string;
  submitLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Script Text *</Label>
            <Textarea
              placeholder="Enter the script or phrase..."
              value={formData.script_text}
              onChange={(e) =>
                setFormData({ ...formData, script_text: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Context *</Label>
              <Select
                value={formData.context}
                onValueChange={(v) =>
                  setFormData({ ...formData, context: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select context" />
                </SelectTrigger>
                <SelectContent>
                  {CONTEXT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Emotional State *</Label>
              <Select
                value={formData.emotional_state}
                onValueChange={(v) =>
                  setFormData({ ...formData, emotional_state: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select emotion" />
                </SelectTrigger>
                <SelectContent>
                  {EMOTIONAL_STATE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source *</Label>
              <Select
                value={formData.source}
                onValueChange={(v) =>
                  setFormData({ ...formData, source: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(v) =>
                  setFormData({ ...formData, frequency: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Meaning (optional)</Label>
            <Input
              placeholder="What does this script mean?"
              value={formData.meaning}
              onChange={(e) =>
                setFormData({ ...formData, meaning: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
