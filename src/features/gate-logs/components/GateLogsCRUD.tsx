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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Eye, LogIn } from 'lucide-react';
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

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

interface GateLogsCRUDProps {
  logs: GateAssistanceLog[];
  onLogsChange: (logs: GateAssistanceLog[]) => void;
  userId: string;
  profiles: Profile[];
}

export default function GateLogsCRUD({
  logs,
  onLogsChange,
  userId,
  profiles,
}: GateLogsCRUDProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<GateAssistanceLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    prefect_id: '',
    log_date: '',
    time_in: '',
    time_out: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      prefect_id: '',
      log_date: '',
      time_in: '',
      time_out: '',
      notes: '',
    });
  };

  const handleCreate = async () => {
    if (!form.prefect_id) {
      toast.error('Please select a prefect');
      return;
    }

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
        prefect_id: form.prefect_id,
        log_date: form.log_date,
        time_in: form.time_in,
        time_out: form.time_out,
        notes: form.notes,
      });
      toast.success('Gate log created successfully');
      setDialogOpen(false);
      resetForm();
      await fetchLogs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create gate log');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedLog) return;

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
      await gateLogsService.updateGateLog(selectedLog.id, {
        log_date: form.log_date,
        time_in: form.time_in,
        time_out: form.time_out,
        notes: form.notes,
      });
      toast.success('Gate log updated successfully');
      setEditDialogOpen(false);
      resetForm();
      setSelectedLog(null);
      await fetchLogs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update gate log');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this gate log?')) return;

    try {
      await gateLogsService.deleteGateLog(id);
      toast.success('Gate log deleted successfully');
      await fetchLogs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete gate log');
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await gateLogsService.fetchGateLogs();
      onLogsChange(data as GateAssistanceLog[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch gate logs');
    }
  };

  const getPrefectName = (prefectId: string) => {
    const profile = profiles.find((p) => p.id === prefectId);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown';
  };

  const openEditDialog = (log: GateAssistanceLog) => {
    setSelectedLog(log);
    setForm({
      prefect_id: log.prefect_id,
      log_date: log.log_date,
      time_in: log.time_in,
      time_out: log.time_out || '',
      notes: log.notes || '',
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Manage Gate Logs</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-1" /> Create Log
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Gate Assistance Log</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="prefect">Prefect *</Label>
                <Select value={form.prefect_id} onValueChange={(val) => setForm((p) => ({ ...p, prefect_id: val }))}>
                  <SelectTrigger id="prefect">
                    <SelectValue placeholder="Select prefect" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                    resetForm();
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

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LogIn size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No gate logs yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{getPrefectName(log.prefect_id)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    📅 {new Date(log.log_date).toLocaleDateString()}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>🕐 In: {log.time_in}</span>
                    {log.time_out && <span>Out: {log.time_out}</span>}
                  </div>
                  {log.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{log.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(log)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(log.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Gate Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_log_date">Log Date *</Label>
              <Input
                id="edit_log_date"
                type="date"
                value={form.log_date}
                onChange={(e) => setForm((p) => ({ ...p, log_date: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_time_in">Time In *</Label>
                <Input
                  id="edit_time_in"
                  type="time"
                  value={form.time_in}
                  onChange={(e) => setForm((p) => ({ ...p, time_in: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit_time_out">Time Out</Label>
                <Input
                  id="edit_time_out"
                  type="time"
                  value={form.time_out}
                  onChange={(e) => setForm((p) => ({ ...p, time_out: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
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
                  setEditDialogOpen(false);
                  resetForm();
                  setSelectedLog(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? 'Updating...' : 'Update Log'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <Label className="text-xs text-muted-foreground">Prefect</Label>
                  <p className="text-sm mt-1">{getPrefectName(selectedLog.prefect_id)}</p>
                </div>
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

              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">
                  {new Date(selectedLog.created_at).toLocaleDateString()}
                </p>
              </div>

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
