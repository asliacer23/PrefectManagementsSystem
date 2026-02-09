import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, FileText } from 'lucide-react';
import * as weeklyReportsService from '../services/weeklyReportsService';
import WeeklyReportsCRUD from './WeeklyReportsCRUD';

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

interface WeeklyReportsViewProps {
  reports: WeeklyReport[];
  onReportsChange: (reports: WeeklyReport[]) => void;
  userId: string;
  isAdmin?: boolean;
}

export default function WeeklyReportsView({
  reports,
  onReportsChange,
  userId,
  isAdmin = false,
}: WeeklyReportsViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    week_start: '',
    week_end: '',
    summary: '',
    achievements: '',
    challenges: '',
  });

  const handleSubmit = async () => {
    if (!form.week_start) {
      toast.error('Week start date is required');
      return;
    }

    if (!form.week_end) {
      toast.error('Week end date is required');
      return;
    }

    if (!form.summary.trim()) {
      toast.error('Summary is required');
      return;
    }

    const startDate = new Date(form.week_start);
    const endDate = new Date(form.week_end);

    if (startDate > endDate) {
      toast.error('Week start date must be before week end date');
      return;
    }

    setLoading(true);
    try {
      await weeklyReportsService.createWeeklyReport(userId, {
        week_start: form.week_start,
        week_end: form.week_end,
        summary: form.summary,
        achievements: form.achievements,
        challenges: form.challenges,
      });
      toast.success('Report submitted successfully');
      setDialogOpen(false);
      setForm({
        week_start: '',
        week_end: '',
        summary: '',
        achievements: '',
        challenges: '',
      });
      await fetchReports();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      let data: WeeklyReport[];
      if (isAdmin) {
        data = await weeklyReportsService.fetchWeeklyReports();
      } else {
        data = await weeklyReportsService.fetchUserWeeklyReports(userId);
      }
      onReportsChange(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch reports');
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.achievements?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (report.challenges?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header with Submit Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">
          {isAdmin ? 'All Weekly Reports' : 'My Weekly Reports'}
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={16} className="mr-1" /> New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Submit Weekly Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="week_start">Week Start</Label>
                  <Input
                    id="week_start"
                    type="date"
                    value={form.week_start}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, week_start: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="week_end">Week End</Label>
                  <Input
                    id="week_end"
                    type="date"
                    value={form.week_end}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, week_end: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Summarize your weekly activities"
                  rows={3}
                  value={form.summary}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, summary: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="achievements">Achievements</Label>
                <Textarea
                  id="achievements"
                  placeholder="What did you accomplish this week?"
                  rows={2}
                  value={form.achievements}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, achievements: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="challenges">Challenges</Label>
                <Textarea
                  id="challenges"
                  placeholder="What challenges did you face?"
                  rows={2}
                  value={form.challenges}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, challenges: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setForm({
                      week_start: '',
                      week_end: '',
                      summary: '',
                      achievements: '',
                      challenges: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Input
          placeholder="Search by summary, achievements, or challenges..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Reports List or Empty State */}
      {reports.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            {isAdmin ? 'No weekly reports yet' : 'You haven\'t submitted any weekly reports yet'}
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reports match your search</p>
        </div>
      ) : (
        <WeeklyReportsCRUD reports={filteredReports} onReportsChange={onReportsChange} />
      )}
    </div>
  );
}
