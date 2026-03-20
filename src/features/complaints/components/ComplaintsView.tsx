import { useMemo, useState } from 'react';
import { Copy, Eye, FileText, Filter, MoreHorizontal, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import * as complaintsService from '../services/complaintsService';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  in_progress: 'bg-info/15 text-info border-info/30',
  resolved: 'bg-success/15 text-success border-success/30',
  dismissed: 'bg-muted text-muted-foreground border-border',
};

interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: string;
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

interface ComplaintsViewProps {
  complaints: Complaint[];
  onComplaintsChange: (complaints: Complaint[]) => void;
  userId: string;
  isAdmin?: boolean;
}

export default function ComplaintsView({
  complaints,
  onComplaintsChange,
  userId,
  isAdmin = false,
}: ComplaintsViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '' });

  const handleSubmit = async () => {
    if (!form.subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }

    setLoading(true);
    try {
      await complaintsService.createComplaint(userId, {
        subject: form.subject,
        description: form.description,
      });
      toast.success('Complaint submitted successfully');
      setDialogOpen(false);
      setForm({ subject: '', description: '' });
      await fetchComplaints();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const data = isAdmin
        ? await complaintsService.fetchComplaints()
        : await complaintsService.fetchUserComplaints(userId);
      onComplaintsChange(data as Complaint[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch complaints');
    }
  };

  const filteredComplaints = useMemo(() => complaints.filter((complaint) => {
    const matchesSearch =
      complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
    return matchesSearch && matchesStatus;
  }), [complaints, filterStatus, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">
          {isAdmin ? 'All Complaints' : 'My Complaints'}
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={16} className="mr-1" /> New Complaint
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Submit Complaint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Search by subject or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setFilterStatus('all')}>All Statuses</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('pending')}>Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('in_progress')}>In Progress</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('resolved')}>Resolved</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('dismissed')}>Dismissed</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setFilterStatus('all'); setSearchTerm(''); }}>Reset Filters</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredComplaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No complaints match your filters' : 'No complaints yet'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Subject</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.subject}</TableCell>
                  <TableCell className="max-w-[320px]"><p className="truncate text-muted-foreground">{complaint.description}</p></TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs capitalize ${statusColors[complaint.status] || ''}`}>{complaint.status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{new Date(complaint.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedComplaint(complaint); setViewDialogOpen(true); }}>
                        <Eye size={14} />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl">
                          <DropdownMenuItem onClick={() => { setSelectedComplaint(complaint); setViewDialogOpen(true); }}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(complaint.subject)}><Copy className="mr-2 h-4 w-4" />Copy Subject</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{selectedComplaint?.subject}</DialogTitle></DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge variant="outline" className={`mt-2 ${statusColors[selectedComplaint.status] || ''} capitalize`}>{selectedComplaint.status.replace('_', ' ')}</Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">{selectedComplaint.description}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
