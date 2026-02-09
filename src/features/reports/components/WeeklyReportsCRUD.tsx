import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Pencil, Trash2, Eye } from 'lucide-react';
import * as weeklyReportsService from '../services/weeklyReportsService';

interface WeeklyReport {
  id: string;
  prefect_id: string;
  week_start: string;
  week_end: string;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  created_at: string;
}

interface WeeklyReportsCRUDProps {
  reports: WeeklyReport[];
  onReportsChange: (reports: WeeklyReport[]) => void;
}

export default function WeeklyReportsCRUD({ reports, onReportsChange }: WeeklyReportsCRUDProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    week_start: '',
    week_end: '',
    summary: '',
    achievements: '',
    challenges: '',
  });

  const handleViewOpen = (report: WeeklyReport) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const handleEditOpen = (report: WeeklyReport) => {
    setSelectedReport(report);
    setEditFormData({
      week_start: report.week_start,
      week_end: report.week_end,
      summary: report.summary,
      achievements: report.achievements || '',
      challenges: report.challenges || '',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = (report: WeeklyReport) => {
    setSelectedReport(report);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReport) return;

    if (!editFormData.week_start) {
      toast.error('Week start date is required');
      return;
    }

    if (!editFormData.week_end) {
      toast.error('Week end date is required');
      return;
    }

    if (!editFormData.summary.trim()) {
      toast.error('Summary is required');
      return;
    }

    setLoading(true);
    try {
      await weeklyReportsService.updateWeeklyReport(selectedReport.id, {
        week_start: editFormData.week_start,
        week_end: editFormData.week_end,
        summary: editFormData.summary,
        achievements: editFormData.achievements,
        challenges: editFormData.challenges,
      });
      toast.success('Report updated successfully');
      setEditDialogOpen(false);
      await fetchReports();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update report');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReport) return;

    setLoading(true);
    try {
      await weeklyReportsService.deleteWeeklyReport(selectedReport.id);
      toast.success('Report deleted successfully');
      setDeleteDialogOpen(false);
      await fetchReports();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete report');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await weeklyReportsService.fetchWeeklyReports();
      onReportsChange(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch reports');
    }
  };

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                📅 {report.week_start} to {report.week_end}
              </p>
              <p className="text-sm text-muted-foreground mt-2">{report.summary}</p>
              {report.achievements && (
                <p className="text-xs mt-2">
                  <span className="font-medium text-success">Achievements:</span> {report.achievements}
                </p>
              )}
              {report.challenges && (
                <p className="text-xs mt-1">
                  <span className="font-medium text-accent">Challenges:</span> {report.challenges}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewOpen(report)}
                className="h-8 w-8"
              >
                <Eye size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditOpen(report)}
                className="h-8 w-8"
              >
                <Pencil size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteOpen(report)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Weekly Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Week Start</Label>
                <p className="text-sm">{selectedReport.week_start}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Week End</Label>
                <p className="text-sm">{selectedReport.week_end}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Summary</Label>
                <p className="text-sm max-h-32 overflow-y-auto">{selectedReport.summary}</p>
              </div>
              {selectedReport.achievements && (
                <div>
                  <Label className="text-muted-foreground text-xs">Achievements</Label>
                  <p className="text-sm max-h-32 overflow-y-auto">{selectedReport.achievements}</p>
                </div>
              )}
              {selectedReport.challenges && (
                <div>
                  <Label className="text-muted-foreground text-xs">Challenges</Label>
                  <p className="text-sm max-h-32 overflow-y-auto">{selectedReport.challenges}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground text-xs">Submitted</Label>
                <p className="text-sm">
                  {new Date(selectedReport.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-full max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Edit Weekly Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="week_start">Week Start</Label>
                <Input
                  id="week_start"
                  type="date"
                  value={editFormData.week_start}
                  onChange={(e) =>
                    setEditFormData((p) => ({ ...p, week_start: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="week_end">Week End</Label>
                <Input
                  id="week_end"
                  type="date"
                  value={editFormData.week_end}
                  onChange={(e) => setEditFormData((p) => ({ ...p, week_end: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                rows={3}
                value={editFormData.summary}
                onChange={(e) => setEditFormData((p) => ({ ...p, summary: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="achievements">Achievements</Label>
              <Textarea
                id="achievements"
                rows={2}
                value={editFormData.achievements}
                onChange={(e) =>
                  setEditFormData((p) => ({ ...p, achievements: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="challenges">Challenges</Label>
              <Textarea
                id="challenges"
                rows={2}
                value={editFormData.challenges}
                onChange={(e) =>
                  setEditFormData((p) => ({ ...p, challenges: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveEdit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-full max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this weekly report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
