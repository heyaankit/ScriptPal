"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  api,
  type ReportResponse,
  type ScheduleResponse,
  type Pagination,
} from "@/lib/api";
import { isApiError } from "@/lib/auth-context";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart3,
  Plus,
  Download,
  Share2,
  Trash2,
  Settings2,
  TrendingUp,
  Trophy,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import {
  REPORT_PERIOD_OPTIONS,
  SCHEDULE_FREQUENCY_OPTIONS,
  type ReportPeriod,
  type ScheduleFrequency,
} from "@/lib/enums";

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState("history");

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage progress reports
          </p>
        </div>
        <GenerateReportDialog />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="history">Report History</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <ReportHistory />
        </TabsContent>

        <TabsContent value="schedules" className="mt-4">
          <ReportSchedules />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportHistory() {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareReportId, setShareReportId] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getReportHistory({ page, page_size: 10 });
      setReports(response.data.items);
      setPagination(response.data.pagination);
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleShare = async () => {
    if (!shareEmail) return;
    setShareLoading(true);
    try {
      await api.shareReportEmail(shareReportId, shareEmail);
      toast.success("Report shared successfully!");
      setShareDialogOpen(false);
      setShareEmail("");
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setShareLoading(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      const response = await api.getReportDownloadUrl(reportId);
      if (response.data.download_url) {
        window.open(response.data.download_url, "_blank");
      }
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">No reports yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generate your first progress report.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{report.title}</h3>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {report.period_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.start_date} — {report.end_date}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {report.total_scripts} scripts
                        </span>
                        {report.positive_pct !== undefined && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {report.positive_pct}% positive
                          </span>
                        )}
                        {report.growth_rate !== undefined && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {report.growth_rate > 0 ? "+" : ""}
                            {report.growth_rate}% growth
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {report.new_milestones} milestones
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShareReportId(report.id);
                          setShareDialogOpen(true);
                        }}
                      >
                        <Share2 className="mr-1 h-3 w-3" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(report.id)}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
        </>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Report via Email</DialogTitle>
            <DialogDescription>
              Send a copy of this report to the specified email address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={shareLoading || !shareEmail}>
              {shareLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Mail className="mr-2 h-4 w-4" />
              Send Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportSchedules() {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ScheduleResponse | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleResponse | null>(null);

  // Form
  const [formFrequency, setFormFrequency] = useState<ScheduleFrequency>("weekly");
  const [formEmail, setFormEmail] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const response = await api.getReportSchedules();
      setSchedules(response.data.items);
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleCreate = async () => {
    if (!formEmail) return;
    setFormLoading(true);
    try {
      await api.createReportSchedule({
        frequency: formFrequency,
        email: formEmail,
      });
      toast.success("Schedule created successfully!");
      setShowCreateDialog(false);
      setFormEmail("");
      loadSchedules();
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editSchedule) return;
    setFormLoading(true);
    try {
      await api.updateReportSchedule(editSchedule.id, {
        frequency: formFrequency,
        email: formEmail,
        active: formActive,
      });
      toast.success("Schedule updated successfully!");
      setShowEditDialog(false);
      setEditSchedule(null);
      loadSchedules();
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setFormLoading(true);
    try {
      await api.deleteReportSchedule(deleteTarget.id);
      toast.success("Schedule deleted successfully!");
      setDeleteTarget(null);
      loadSchedules();
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setShowCreateDialog(true); setFormFrequency("weekly"); setFormEmail(""); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Schedule
        </Button>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">No schedules</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Set up automatic report delivery.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold capitalize">{schedule.frequency} Report</h3>
                      <Badge variant={schedule.active ? "default" : "secondary"}>
                        {schedule.active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Mail className="inline h-3 w-3 mr-1" />
                      {schedule.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Created {schedule.created_at}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditSchedule(schedule);
                        setFormFrequency(schedule.frequency);
                        setFormEmail(schedule.email);
                        setFormActive(schedule.active);
                        setShowEditDialog(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(schedule)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Schedule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Report Schedule</DialogTitle>
            <DialogDescription>
              Set up automatic report delivery to your email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={formFrequency}
                onValueChange={(v) => setFormFrequency(v as ScheduleFrequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={formLoading || !formEmail}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={formFrequency}
                onValueChange={(v) => setFormFrequency(v as ScheduleFrequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule?
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
    </>
  );
}

function GenerateReportDialog() {
  const [open, setOpen] = useState(false);
  const [periodType, setPeriodType] = useState<ReportPeriod>("week");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await api.generateReport({
        period_type: periodType,
        title: title || undefined,
      });
      toast.success("Report generated successfully!");
      setOpen(false);
      setTitle("");
    } catch (err) {
      if (isApiError(err)) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Generate Report
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New Report</DialogTitle>
            <DialogDescription>
              Create a new progress report for the selected period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select
                value={periodType}
                onValueChange={(v) => setPeriodType(v as ReportPeriod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_PERIOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                placeholder="e.g., March Progress Report"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
