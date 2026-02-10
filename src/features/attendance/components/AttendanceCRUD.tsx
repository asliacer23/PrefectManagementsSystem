import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2, Eye, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import * as attendanceService from '../services/attendanceService';

interface Attendance {
  id: string;
  prefect_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AttendanceCRUDProps {
  attendance: Attendance[];
  onAttendanceChange: (attendance: Attendance[]) => void;
  userId: string;
  profiles: Profile[];
}

export default function AttendanceCRUD({
  attendance,
  onAttendanceChange,
  profiles,
}: AttendanceCRUDProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    prefect_id: '',
    date: '',
    time_in: '',
    time_out: '',
    status: 'present',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      prefect_id: '',
      date: '',
      time_in: '',
      time_out: '',
      status: 'present',
      notes: '',
    });
    setSelectedRecord(null);
  };

  const handleCreateOpen = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEditOpen = (record: Attendance) => {
    setSelectedRecord(record);
    setFormData({
      prefect_id: record.prefect_id,
      date: record.date,
      time_in: record.time_in ? record.time_in.substring(0, 16) : '',
      time_out: record.time_out ? record.time_out.substring(0, 16) : '',
      status: record.status,
      notes: record.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleViewOpen = (record: Attendance) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleDeleteOpen = (record: Attendance) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.prefect_id || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const newRecord = await attendanceService.createAttendance({
        prefect_id: formData.prefect_id,
        date: formData.date,
        time_in: formData.time_in ? new Date(formData.time_in).toISOString() : null,
        time_out: formData.time_out ? new Date(formData.time_out).toISOString() : null,
        status: formData.status,
        notes: formData.notes || null,
      });

      onAttendanceChange([newRecord, ...attendance]);
      toast.success('Attendance record created successfully');
      setCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create attendance record');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRecord) return;

    setLoading(true);
    try {
      const updated = await attendanceService.updateAttendance(selectedRecord.id, {
        date: formData.date,
        time_in: formData.time_in ? new Date(formData.time_in).toISOString() : null,
        time_out: formData.time_out ? new Date(formData.time_out).toISOString() : null,
        status: formData.status,
        notes: formData.notes || null,
      });

      onAttendanceChange(
        attendance.map((r) => (r.id === selectedRecord.id ? updated : r))
      );
      toast.success('Attendance record updated successfully');
      setEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update attendance record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;

    setLoading(true);
    try {
      await attendanceService.deleteAttendance(selectedRecord.id);
      onAttendanceChange(attendance.filter((r) => r.id !== selectedRecord.id));
      toast.success('Attendance record deleted successfully');
      setDeleteDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete attendance record');
    } finally {
      setLoading(false);
    }
  };

  const getPrefectName = (prefectId: string) => {
    const profile = profiles.find((p) => p.id === prefectId);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown';
  };

  const getPrefectProfile = (prefectId: string) => {
    return profiles.find((p) => p.id === prefectId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Manage Attendance</h2>
          <p className="text-sm text-muted-foreground">Create, edit and delete attendance records</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleCreateOpen}>
              <Plus size={16} className="mr-2" /> New Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Attendance Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="prefect-select">Prefect</Label>
                <Select value={formData.prefect_id} onValueChange={(v) => setFormData({ ...formData, prefect_id: v })}>
                  <SelectTrigger id="prefect-select">
                    <SelectValue placeholder="Select a prefect" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex flex-col">
                          <span>{p.first_name} {p.last_name}</span>
                          <span className="text-xs text-muted-foreground">{p.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(new Date(formData.date + 'T00:00:00'), 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date + 'T00:00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          setFormData({ ...formData, date: dateStr });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="time-in">Time In</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const now = new Date();
                        const formatted = now.toISOString().slice(0, 16);
                        setFormData({ ...formData, time_in: formatted });
                      }}
                      className="h-7 text-xs"
                    >
                      Now
                    </Button>
                  </div>
                  <Input
                    id="time-in"
                    type="datetime-local"
                    value={formData.time_in}
                    onChange={(e) => setFormData({ ...formData, time_in: e.target.value })}
                    placeholder="Enter check-in time"
                  />
                  <p className="text-xs text-muted-foreground mt-1">When prefect checked in</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="time-out">Time Out</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const now = new Date();
                        const formatted = now.toISOString().slice(0, 16);
                        setFormData({ ...formData, time_out: formatted });
                      }}
                      className="h-7 text-xs"
                    >
                      Now
                    </Button>
                  </div>
                  <Input
                    id="time-out"
                    type="datetime-local"
                    value={formData.time_out}
                    onChange={(e) => setFormData({ ...formData, time_out: e.target.value })}
                    placeholder="Enter check-out time"
                  />
                  <p className="text-xs text-muted-foreground mt-1">When prefect checked out</p>
                </div>
              </div>

              <div>
                <Label htmlFor="status-select">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger id="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes-input">Notes</Label>
                <Textarea
                  id="notes-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <Button onClick={handleCreate} disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Record'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prefect</p>
                {getPrefectProfile(selectedRecord.prefect_id) ? (
                  <div className="mt-2">
                    <p className="font-semibold text-base">{getPrefectProfile(selectedRecord.prefect_id)?.first_name} {getPrefectProfile(selectedRecord.prefect_id)?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{getPrefectProfile(selectedRecord.prefect_id)?.email}</p>
                  </div>
                ) : (
                  <p className="text-base text-muted-foreground mt-1">Unknown</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</p>
                <p className="font-medium mt-1">{new Date(selectedRecord.date).toLocaleDateString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time In</p>
                  <p className="font-medium mt-1">
                    {selectedRecord.time_in
                      ? new Date(selectedRecord.time_in).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time Out</p>
                  <p className="font-medium mt-1">
                    {selectedRecord.time_out
                      ? new Date(selectedRecord.time_out).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : 'Not set'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Status</p>
                <Badge className={getStatusColor(selectedRecord.status)}>
                  {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                </Badge>
              </div>
              {selectedRecord.notes && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</p>
                  <p className="font-medium text-sm mt-2">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="edit-time-in">Time In</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const formatted = now.toISOString().slice(0, 16);
                      setFormData({ ...formData, time_in: formatted });
                    }}
                    className="h-7 text-xs"
                  >
                    Now
                  </Button>
                </div>
                <Input
                  id="edit-time-in"
                  type="datetime-local"
                  value={formData.time_in}
                  onChange={(e) => setFormData({ ...formData, time_in: e.target.value })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="edit-time-out">Time Out</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const formatted = now.toISOString().slice(0, 16);
                      setFormData({ ...formData, time_out: formatted });
                    }}
                    className="h-7 text-xs"
                  >
                    Now
                  </Button>
                </div>
                <Input
                  id="edit-time-out"
                  type="datetime-local"
                  value={formData.time_out}
                  onChange={(e) => setFormData({ ...formData, time_out: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>

            <Button onClick={handleUpdate} disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Update Record'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Attendance Record?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the attendance record for{' '}
            {selectedRecord && getPrefectName(selectedRecord.prefect_id)} on{' '}
            {selectedRecord && new Date(selectedRecord.date).toLocaleDateString()}. This action cannot be
            undone.
          </AlertDialogDescription>
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

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Total: {attendance.length} records</CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No attendance records yet. Create one to get started.</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="space-y-2">
                {attendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{getPrefectName(record.prefect_id)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.date).toLocaleDateString()} •{' '}
                        {record.time_in ? new Date(record.time_in).toLocaleTimeString() : 'No check-in'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(record.status)}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleViewOpen(record)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditOpen(record)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteOpen(record)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
