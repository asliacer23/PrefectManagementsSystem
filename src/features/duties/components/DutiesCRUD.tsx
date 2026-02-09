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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Eye, Clock, X } from 'lucide-react';
import * as dutiesService from '../services/dutiesService';

const statusColors: Record<string, string> = {
  assigned: 'bg-info/15 text-info',
  completed: 'bg-success/15 text-success',
  missed: 'bg-destructive/15 text-destructive',
};

interface DutyAssignment {
  id: string;
  prefect_id: string;
  title: string;
  description: string | null;
  duty_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: string;
  assigned_by: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface DutiesCRUDProps {
  duties: DutyAssignment[];
  onDutiesChange: (duties: DutyAssignment[]) => void;
  userId: string;
  profiles: Profile[];
}

export default function DutiesCRUD({
  duties,
  onDutiesChange,
  userId,
  profiles,
}: DutiesCRUDProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<DutyAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    prefect_ids: [] as string[],
    title: '',
    description: '',
    duty_date: '',
    start_time: '',
    end_time: '',
    location: '',
  });

  const resetForm = () => {
    setForm({
      prefect_ids: [],
      title: '',
      description: '',
      duty_date: '',
      start_time: '',
      end_time: '',
      location: '',
    });
  };

  const handleCreate = async () => {
    if (form.prefect_ids.length === 0) {
      toast.error('Please select at least one prefect');
      return;
    }

    if (!form.title.trim()) {
      toast.error('Duty title is required');
      return;
    }

    if (!form.duty_date) {
      toast.error('Duty date is required');
      return;
    }

    setLoading(true);
    try {
      await dutiesService.createDuty(userId, {
        prefect_ids: form.prefect_ids,
        title: form.title,
        description: form.description,
        duty_date: form.duty_date,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location,
      });
      toast.success('Duty created successfully');
      setDialogOpen(false);
      resetForm();
      await fetchDuties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create duty');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDuty) return;

    if (!form.title.trim()) {
      toast.error('Duty title is required');
      return;
    }

    setLoading(true);
    try {
      await dutiesService.updateDuty(selectedDuty.id, {
        title: form.title,
        description: form.description,
        duty_date: form.duty_date,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location,
      });
      toast.success('Duty updated successfully');
      setEditDialogOpen(false);
      resetForm();
      setSelectedDuty(null);
      await fetchDuties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update duty');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this duty?')) return;

    try {
      await dutiesService.deleteDuty(id);
      toast.success('Duty deleted successfully');
      await fetchDuties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete duty');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await dutiesService.updateDutyStatus(id, newStatus as dutiesService.DutyStatus);
      toast.success('Status updated successfully');
      await fetchDuties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const fetchDuties = async () => {
    try {
      const data = await dutiesService.fetchDuties();
      onDutiesChange(data as DutyAssignment[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch duties');
    }
  };

  const getPrefectName = (prefectIdStr: string) => {
    const ids = dutiesService.parsePrefectIds(prefectIdStr);
    return ids
      .map((id) => {
        const profile = profiles.find((p) => p.id === id);
        if (!profile) return 'Unknown';
        return `${profile.first_name} ${profile.last_name}`;
      })
      .join(', ');
  };

  const getPrefectDetails = (prefectIdStr: string) => {
    const ids = dutiesService.parsePrefectIds(prefectIdStr);
    return ids
      .map((id) => {
        const profile = profiles.find((p) => p.id === id);
        if (!profile) return { name: 'Unknown', email: '' };
        return {
          name: `${profile.first_name} ${profile.last_name}`,
          email: profile.email,
        };
      })
      .filter((p) => p.name !== 'Unknown');
  };

  const openEditDialog = (duty: DutyAssignment) => {
    const prefectIds = dutiesService.parsePrefectIds(duty.prefect_id);
    setSelectedDuty(duty);
    setForm({
      prefect_ids: prefectIds,
      title: duty.title,
      description: duty.description || '',
      duty_date: duty.duty_date,
      start_time: duty.start_time || '',
      end_time: duty.end_time || '',
      location: duty.location || '',
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Manage Duty Assignments</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-1" /> Assign Duty
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Duty Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="mb-3 block">Assign Prefects *</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-border rounded-lg p-3">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="flex items-start gap-3">
                      <Checkbox
                        id={`prefect-${profile.id}`}
                        checked={form.prefect_ids.includes(profile.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setForm((p) => ({
                              ...p,
                              prefect_ids: [...p.prefect_ids, profile.id],
                            }));
                          } else {
                            setForm((p) => ({
                              ...p,
                              prefect_ids: p.prefect_ids.filter((id) => id !== profile.id),
                            }));
                          }
                        }}
                      />
                      <label
                        htmlFor={`prefect-${profile.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="text-sm font-medium">
                          {profile.first_name} {profile.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {profile.email}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                {form.prefect_ids.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.prefect_ids.map((id) => {
                      const profile = profiles.find((p) => p.id === id);
                      return (
                        <Badge key={id} variant="secondary" className="gap-1">
                          {profile?.first_name} {profile?.last_name}
                          <button
                            onClick={() => {
                              setForm((p) => ({
                                ...p,
                                prefect_ids: p.prefect_ids.filter((pid) => pid !== id),
                              }));
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Gate duty, Event coordination"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the duty..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="duty_date">Duty Date *</Label>
                <Input
                  id="duty_date"
                  type="date"
                  value={form.duty_date}
                  onChange={(e) => setForm((p) => ({ ...p, duty_date: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Main Gate, Auditorium"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
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
                  {loading ? 'Creating...' : 'Create Duty'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {duties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No duties assigned yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {duties.map((duty) => (
            <div
              key={duty.id}
              className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{duty.title}</h3>
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    {getPrefectDetails(duty.prefect_id).map((prefect, idx) => (
                      <div key={idx}>
                        <p className="font-medium">{prefect.name}</p>
                        <p className="text-xs">{prefect.email}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {duty.description}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>📅 {new Date(duty.duty_date).toLocaleDateString()}</span>
                    {duty.start_time && <span>🕐 {duty.start_time}</span>}
                    {duty.location && <span>📍 {duty.location}</span>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                  <Select value={duty.status} onValueChange={(val) => handleStatusChange(duty.id, val)}>
                    <SelectTrigger className="w-full sm:w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${statusColors[duty.status] || ''}`}
                  >
                    {duty.status}
                  </Badge>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDuty(duty);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(duty)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(duty.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
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
            <DialogTitle>Edit Duty Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_title">Title *</Label>
              <Input
                id="edit_title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit_duty_date">Duty Date *</Label>
              <Input
                id="edit_duty_date"
                type="date"
                value={form.duty_date}
                onChange={(e) => setForm((p) => ({ ...p, duty_date: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_start_time">Start Time</Label>
                <Input
                  id="edit_start_time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit_end_time">End Time</Label>
                <Input
                  id="edit_end_time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_location">Location</Label>
              <Input
                id="edit_location"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  resetForm();
                  setSelectedDuty(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? 'Updating...' : 'Update Duty'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDuty?.title}</DialogTitle>
          </DialogHeader>
          {selectedDuty && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Assigned To</Label>
                  <div className="mt-2 space-y-2">
                    {getPrefectDetails(selectedDuty.prefect_id).map((prefect, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="font-medium">{prefect.name}</p>
                        <p className="text-xs text-muted-foreground">{prefect.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge
                    variant="outline"
                    className={`mt-2 text-xs capitalize ${statusColors[selectedDuty.status] || ''}`}
                  >
                    {selectedDuty.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">
                  {selectedDuty.description || 'No description provided'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Duty Date</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedDuty.duty_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <p className="text-sm mt-1">{selectedDuty.location || 'Not specified'}</p>
                </div>
              </div>

              {(selectedDuty.start_time || selectedDuty.end_time) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Start Time</Label>
                    <p className="text-sm mt-1">{selectedDuty.start_time || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">End Time</Label>
                    <p className="text-sm mt-1">{selectedDuty.end_time || 'Not specified'}</p>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">
                  {new Date(selectedDuty.created_at).toLocaleDateString()}
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
