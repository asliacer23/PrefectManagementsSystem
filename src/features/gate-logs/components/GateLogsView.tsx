import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Eye, LogIn } from 'lucide-react';
import * as gateLogsService from '../services/gateLogsService';

interface GateAssistanceLog {
  id: string;
  prefect_id: string;
  log_date: string;
  time_in: string;
  time_out: string | null;
  notes: string | null;
  created_at: string;
}

interface GateLogsViewProps {
  logs: GateAssistanceLog[];
  onLogsChange: (logs: GateAssistanceLog[]) => void;
  userId: string;
  isAdmin?: boolean;
}

export default function GateLogsView({
  logs,
  onLogsChange,
  userId,
  isAdmin = false,
}: GateLogsViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<GateAssistanceLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    log_date: '',
    time_in: '',
    time_out: '',
    notes: '',
  });

  const userLogs = isAdmin ? logs : logs.filter((l) => l.prefect_id === userId);

  const stats = {
    total: userLogs.length,
    thisMonth: userLogs.filter((l) => {
      const logDate = new Date(l.log_date);
      const today = new Date();
      return (
        logDate.getMonth() === today.getMonth() &&
        logDate.getFullYear() === today.getFullYear()
      );
    }).length,
  };

  const handleCreate = async () => {
    if (!form.log_date) {
      toast.error('Log date is required');
      return;
    }

    if (!form.time_in) {
      toast.error('Time in is required');
      return;
    }

    setLoading(true);
    try {
      await gateLogsService.createGateLog({
        prefect_id: userId,
        log_date: form.log_date,
        time_in: form.time_in,
        time_out: form.time_out,
        notes: form.notes,
      });
      toast.success('Gate log created successfully');
      setDialogOpen(false);
      setForm({
        log_date: '',
        time_in: '',
        time_out: '',
        notes: '',
      });
      await fetchLogs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create gate log');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      let data;
      if (isAdmin) {
        data = await gateLogsService.fetchGateLogs();
      } else {
        data = await gateLogsService.fetchUserGateLogs(userId);
      }
      onLogsChange(data as GateAssistanceLog[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch gate logs');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {isAdmin ? 'All Gate Logs' : 'My Gate Assistance Logs'}
        </h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Logs</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">This Month</p>
            <p className="text-2xl font-semibold">{stats.thisMonth}</p>
          </div>
        </div>

        {/* Create Button */}
        {!isAdmin && (
          <div className="mb-6">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={16} className="mr-1" /> Log Gate Assistance
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Gate Assistance Log</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="log_date">Log Date *</Label>
                    <Input
                      id="log_date"
                      type="date"
                      value={form.log_date}
                      onChange={(e) => setForm((p) => ({ ...p, log_date: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="time_in">Time In *</Label>
                      <Input
                        id="time_in"
                        type="time"
                        value={form.time_in}
                        onChange={(e) => setForm((p) => ({ ...p, time_in: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time_out">Time Out</Label>
                      <Input
                        id="time_out"
                        type="time"
                        value={form.time_out}
                        onChange={(e) => setForm((p) => ({ ...p, time_out: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes about the gate assistance..."
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        setForm({
                          log_date: '',
                          time_in: '',
                          time_out: '',
                          notes: '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={loading}>
                      {loading ? 'Creating...' : 'Create Log'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {userLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LogIn size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No gate logs yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">
                    📅 {new Date(log.log_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                  <div className="flex gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                    <span>🕐 In: {log.time_in}</span>
                    {log.time_out && <span>Out: {log.time_out}</span>}
                  </div>
                  {log.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{log.notes}</p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedLog(log);
                    setViewDialogOpen(true);
                  }}
                >
                  <Eye size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gate Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Log Date</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedLog.log_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedLog.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Time In</Label>
                  <p className="text-sm mt-1">{selectedLog.time_in}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Time Out</Label>
                  <p className="text-sm mt-1">{selectedLog.time_out || 'Not recorded'}</p>
                </div>
              </div>

              {selectedLog.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">
                    {selectedLog.notes}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
