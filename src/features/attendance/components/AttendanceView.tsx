import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle, Clock, Eye, XCircle } from 'lucide-react';
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

interface AttendanceViewProps {
  attendance: Attendance[];
  onAttendanceChange: (attendance: Attendance[]) => void;
  userId: string;
  isAdmin: boolean;
  profiles: Profile[];
}

export default function AttendanceView({
  attendance,
  onAttendanceChange,
  userId,
  isAdmin,
  profiles,
}: AttendanceViewProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const filteredAttendance = useMemo(() => {
    let result = isAdmin ? attendance : attendance.filter((a) => a.prefect_id === userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      result = result.filter((a) => {
        const recordDate = new Date(a.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });
    } else if (dateFilter === 'week') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      result = result.filter((a) => new Date(a.date) >= weekStart);
    } else if (dateFilter === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      result = result.filter((a) => new Date(a.date) >= monthStart);
    }

    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    return result;
  }, [attendance, userId, isAdmin, dateFilter, statusFilter]);

  const stats = useMemo(() => {
    const filtered = isAdmin ? attendance : attendance.filter((a) => a.prefect_id === userId);
    return {
      total: filtered.length,
      present: filtered.filter((a) => a.status === 'present').length,
      absent: filtered.filter((a) => a.status === 'absent').length,
      late: filtered.filter((a) => a.status === 'late').length,
    };
  }, [attendance, userId, isAdmin]);

  const getPrefectName = (prefectId: string) => {
    const profile = profiles.find((p) => p.id === prefectId);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown';
  };

  const getPrefectProfile = (prefectId: string) => profiles.find((p) => p.id === prefectId);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'absent':
        return <XCircle size={16} className="text-red-600" />;
      case 'late':
        return <Clock size={16} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const handleViewOpen = (record: Attendance) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleStatusUpdate = async (recordId: string, newStatus: string) => {
    setLoading(true);
    try {
      const updated = await attendanceService.updateAttendanceStatus(recordId, newStatus);
      onAttendanceChange(attendance.map((r) => (r.id === recordId ? updated : r)));
      toast.success('Status updated successfully');
      if (selectedRecord?.id === recordId) setSelectedRecord(updated);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-green-600">Present</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.present}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-yellow-600">Late</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{stats.late}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-red-600">Absent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.absent}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="date-filter">Date Range</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger id="date-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Showing {filteredAttendance.length} records</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAttendance.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <Calendar size={40} className="mx-auto mb-2 opacity-40" />
                <p>No attendance records found</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prefect</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time In</TableHead>
                    <TableHead>Time Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <span className="font-medium">{getPrefectName(record.prefect_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.time_in ? new Date(record.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No check-in'}</TableCell>
                      <TableCell>{record.time_out ? new Date(record.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not set'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleViewOpen(record)}>
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
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Attendance Details</DialogTitle></DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prefect</p>
                {getPrefectProfile(selectedRecord.prefect_id) ? (
                  <div className="mt-2">
                    <p className="text-base font-semibold">{getPrefectProfile(selectedRecord.prefect_id)?.first_name} {getPrefectProfile(selectedRecord.prefect_id)?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{getPrefectProfile(selectedRecord.prefect_id)?.email}</p>
                  </div>
                ) : <p className="mt-1 text-base text-muted-foreground">Unknown</p>}
              </div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</p><p className="mt-1 font-medium">{new Date(selectedRecord.date).toLocaleDateString()}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time In</p><p className="mt-1 font-medium">{selectedRecord.time_in ? new Date(selectedRecord.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not set'}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time Out</p><p className="mt-1 font-medium">{selectedRecord.time_out ? new Date(selectedRecord.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not set'}</p></div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                {isAdmin ? (
                  <Select value={selectedRecord.status} onValueChange={(val) => handleStatusUpdate(selectedRecord.id, val)} disabled={loading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getStatusColor(selectedRecord.status)}>
                    {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                  </Badge>
                )}
              </div>
              {selectedRecord.notes && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
                  <p className="mt-2 text-sm font-medium">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
