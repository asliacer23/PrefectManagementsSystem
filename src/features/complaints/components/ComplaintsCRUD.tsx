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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Pencil, Trash2, Eye } from 'lucide-react';
import * as complaintsService from '../services/complaintsService';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  in_progress: 'bg-info/15 text-info border-info/30',
  resolved: 'bg-success/15 text-success border-success/30',
  dismissed: 'bg-muted text-muted-foreground border-border',
};

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
];

interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: string;
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

interface ComplaintsCRUDProps {
  complaints: Complaint[];
  onComplaintsChange: (complaints: Complaint[]) => void;
}

export default function ComplaintsCRUD({ complaints, onComplaintsChange }: ComplaintsCRUDProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    subject: '',
    description: '',
    status: 'pending',
  });

  const handleViewOpen = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setViewDialogOpen(true);
  };

  const handleEditOpen = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setEditFormData({
      subject: complaint.subject,
      description: complaint.description,
      status: complaint.status,
    });
    setEditDialogOpen(true);
  };

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    setLoading(true);
    try {
      await complaintsService.updateComplaintStatus(
        complaintId,
        newStatus as complaintsService.ComplaintStatus
      );
      toast.success('Status updated successfully');
      await fetchComplaints();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedComplaint) return;

    if (!editFormData.subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    if (!editFormData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    setLoading(true);
    try {
      await complaintsService.updateComplaint(selectedComplaint.id, {
        subject: editFormData.subject,
        description: editFormData.description,
        status: editFormData.status as complaintsService.ComplaintStatus,
      });
      toast.success('Complaint updated successfully');
      setEditDialogOpen(false);
      setSelectedComplaint(null);
      await fetchComplaints();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOpen = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDeleteDialogOpen(true);
  };

  const handleDeleteComplaint = async () => {
    if (!selectedComplaint) return;

    setLoading(true);
    try {
      await complaintsService.deleteComplaint(selectedComplaint.id);
      toast.success('Complaint deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedComplaint(null);
      await fetchComplaints();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete complaint');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const data = await complaintsService.fetchComplaints();
      onComplaintsChange(data as Complaint[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch complaints');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">All Complaints</h2>

      {/* Complaints List */}
      <div className="space-y-3">
        {complaints.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No complaints found</p>
          </div>
        ) : (
          complaints.map((complaint) => (
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

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Select
                    value={complaint.status}
                    onValueChange={(value) => handleStatusChange(complaint.id, value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewOpen(complaint)}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditOpen(complaint)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteOpen(complaint)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEditOpen(selectedComplaint);
                  }}
                >
                  <Pencil size={14} className="mr-1" /> Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Complaint</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-subject">Subject</Label>
                <Input
                  id="edit-subject"
                  placeholder="Complaint subject"
                  value={editFormData.subject}
                  onChange={(e) => setEditFormData((p) => ({ ...p, subject: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Complaint description"
                  rows={6}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(v) => setEditFormData((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-full max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Complaint?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedComplaint?.subject}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComplaint}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
