import { useMemo, useState } from 'react';
import { Clock, Copy, Eye, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
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

  const userDuties = isAdmin ? duties : duties.filter((duty) => duty.prefect_id === userId);
  const filteredDuties = useMemo(() => statusFilter === 'all'
    ? userDuties
    : userDuties.filter((duty) => duty.status === statusFilter), [statusFilter, userDuties]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoading(true);
    try {
      await dutiesService.updateDutyStatus(id, newStatus as dutiesService.DutyStatus);
      toast.success('Status updated successfully');
      const data = isAdmin ? await dutiesService.fetchDuties() : await dutiesService.fetchUserDuties(userId);
      onDutiesChange(data as DutyAssignment[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{isAdmin ? 'All Duties' : 'My Assigned Duties'}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full"><Filter className="h-4 w-4" />Filter</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Duties</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('assigned')}>Assigned</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('missed')}>Missed</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>Reset Filter</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredDuties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No duties available</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDuties.map((duty) => (
                <TableRow key={duty.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{duty.title}</p>
                      <p className="truncate text-xs text-muted-foreground max-w-[280px]">{duty.description || 'No description provided'}</p>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(duty.duty_date).toLocaleDateString()}</TableCell>
                  <TableCell>{duty.start_time && duty.end_time ? `${duty.start_time} - ${duty.end_time}` : 'N/A'}</TableCell>
                  <TableCell>{duty.location || 'N/A'}</TableCell>
                  <TableCell>
                    {!isAdmin && duty.status === 'assigned' ? (
                      <Select value={duty.status} onValueChange={(value) => handleStatusChange(duty.id, value)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="missed">Missed</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={`capitalize ${statusColors[duty.status] || ''}`}>{duty.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedDuty(duty); setViewDialogOpen(true); }}>
                        <Eye size={14} />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl">
                          <DropdownMenuItem onClick={() => { setSelectedDuty(duty); setViewDialogOpen(true); }}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(duty.title)}><Copy className="mr-2 h-4 w-4" />Copy Title</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedDuty?.title}</DialogTitle></DialogHeader>
          {selectedDuty && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-muted-foreground">Status</Label><Badge variant="outline" className={`mt-2 capitalize ${statusColors[selectedDuty.status] || ''}`}>{selectedDuty.status}</Badge></div>
                <div><Label className="text-xs text-muted-foreground">Duty Date</Label><p className="text-sm mt-1">{new Date(selectedDuty.duty_date).toLocaleDateString()}</p></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">Description</Label><div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">{selectedDuty.description || 'No description provided'}</div></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
