import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { Plus, Eye, Clock } from 'lucide-react';
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

interface DutiesViewProps {
  duties: DutyAssignment[];
  onDutiesChange: (duties: DutyAssignment[]) => void;
  userId: string;
  isAdmin?: boolean;
}

export default function DutiesView({
  duties,
  onDutiesChange,
  userId,
  isAdmin = false,
}: DutiesViewProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<DutyAssignment | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const userDuties = isAdmin ? duties : duties.filter((d) => d.prefect_id === userId);

  const filteredDuties = statusFilter === 'all' 
    ? userDuties 
    : userDuties.filter((d) => d.status === statusFilter);

  const stats = {
    assigned: userDuties.filter((d) => d.status === 'assigned').length,
    completed: userDuties.filter((d) => d.status === 'completed').length,
    missed: userDuties.filter((d) => d.status === 'missed').length,
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoading(true);
    try {
      await dutiesService.updateDutyStatus(id, newStatus as dutiesService.DutyStatus);
      toast.success('Status updated successfully');
      await fetchDuties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const fetchDuties = async () => {
    try {
      let data;
      if (isAdmin) {
        data = await dutiesService.fetchDuties();
      } else {
        data = await dutiesService.fetchUserDuties(userId);
      }
      onDutiesChange(data as DutyAssignment[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch duties');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {isAdmin ? 'All Duties' : 'My Assigned Duties'}
        </h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Assigned</p>
            <p className="text-2xl font-semibold">{stats.assigned}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Completed</p>
            <p className="text-2xl font-semibold text-success">{stats.completed}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Missed</p>
            <p className="text-2xl font-semibold text-destructive">{stats.missed}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
          <Label htmlFor="status-filter" className="text-sm font-medium">
            Filter by Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Duties</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredDuties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            {statusFilter === 'all'
              ? 'No duties assigned yet'
              : `No ${statusFilter} duties`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDuties.map((duty) => (
            <div
              key={duty.id}
              className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{duty.title}</h3>
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
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${statusColors[duty.status] || ''}`}
                  >
                    {duty.status}
                  </Badge>

                  {!isAdmin && duty.status === 'assigned' && (
                    <Select
                      value={duty.status}
                      onValueChange={(val) => handleStatusChange(duty.id, val)}
                    >
                      <SelectTrigger className="w-full sm:w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="missed">Mark as Missed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDuty?.title}</DialogTitle>
          </DialogHeader>
          {selectedDuty && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge
                    variant="outline"
                    className={`mt-2 text-xs capitalize ${statusColors[selectedDuty.status] || ''}`}
                  >
                    {selectedDuty.status}
                  </Badge>
                </div>
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
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">
                  {selectedDuty.description || 'No description provided'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <p className="text-sm mt-1">{selectedDuty.location || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Duration</Label>
                  <p className="text-sm mt-1">
                    {selectedDuty.start_time && selectedDuty.end_time
                      ? `${selectedDuty.start_time} - ${selectedDuty.end_time}`
                      : 'Not specified'}
                  </p>
                </div>
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
