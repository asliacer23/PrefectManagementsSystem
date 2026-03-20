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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Eye, LogIn, Plus } from 'lucide-react';
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
      return logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear();
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
      const data = isAdmin
        ? await gateLogsService.fetchGateLogs()
        : await gateLogsService.fetchUserGateLogs(userId);
      onLogsChange(data as GateAssistanceLog[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch gate logs');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-lg font-semibold">{isAdmin ? 'All Gate Logs' : 'My Gate Assistance Logs'}</h2>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 text-xs text-muted-foreground">Total Logs</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 text-xs text-muted-foreground">This Month</p>
            <p className="text-2xl font-semibold">{stats.thisMonth}</p>
          </div>
        </div>

        {!isAdmin && (
          <div className="mb-6">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={16} className="mr-1" /> Log Gate Assistance
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        setForm({ log_date: '', time_in: '', time_out: '', notes: '' });
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
          <LogIn size={48} className="mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">No gate logs yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {new Date(log.log_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>{log.time_in}</TableCell>
                  <TableCell>{log.time_out || 'Not recorded'}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {log.notes || 'No notes'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedLog(log);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye size={14} className="mr-1" /> View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gate Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Log Date</Label>
                  <p className="mt-1 text-sm">
                    {new Date(selectedLog.log_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="mt-1 text-sm">{new Date(selectedLog.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Time In</Label>
                  <p className="mt-1 text-sm">{selectedLog.time_in}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Time Out</Label>
                  <p className="mt-1 text-sm">{selectedLog.time_out || 'Not recorded'}</p>
                </div>
              </div>
              {selectedLog.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <div className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-sm">
                    {selectedLog.notes}
                  </div>
                </div>
              )}
              <div className="flex justify-end border-t border-border pt-4">
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
