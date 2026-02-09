import { useState } from 'react';
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
import { toast } from 'sonner';
import { Plus, FileText, Eye } from 'lucide-react';
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
      let data: Complaint[];
      if (isAdmin) {
        data = (await complaintsService.fetchComplaints()) as Complaint[];
      } else {
        data = (await complaintsService.fetchUserComplaints(userId)) as Complaint[];
      }
      onComplaintsChange(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch complaints');
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header with Submit Button */}
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
                <Input
                  id="subject"
                  placeholder="Complaint subject"
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your complaint in detail"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setForm({ subject: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="search">Search Complaints</Label>
          <Input
            id="search"
            placeholder="Search by subject or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="status-filter">Filter by Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger id="status-filter" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No complaints match your filters' : 'No complaints yet'}
          </p>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground">
              Submit your first complaint to get started
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map((complaint) => (
            <div
              key={complaint.id}
              className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{complaint.subject}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {complaint.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize flex-shrink-0 ${
                      statusColors[complaint.status] || ''
                    }`}
                  >
                    {complaint.status.replace('_', ' ')}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedComplaint(complaint);
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
            <DialogTitle>{selectedComplaint?.subject}</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge
                  variant="outline"
                  className={`mt-2 ${statusColors[selectedComplaint.status] || ''} capitalize`}
                >
                  {selectedComplaint.status.replace('_', ' ')}
                </Badge>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">
                  {selectedComplaint.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedComplaint.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Updated</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedComplaint.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
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
