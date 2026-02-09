import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Eye } from 'lucide-react';
import * as recruitmentService from '../services/recruitmentService';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/15 text-warning',
  under_review: 'bg-info/15 text-info',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
};

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

interface Application {
  id: string;
  applicant_id: string;
  statement: string;
  gpa?: number;
  status: string;
  review_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
}

interface RecruitmentCRUDProps {
  applications: Application[];
  profiles: Profile[];
  onApplicationsChange: (applications: Application[]) => void;
  userId: string;
}

export default function RecruitmentCRUD({
  applications,
  profiles,
  onApplicationsChange,
  userId,
}: RecruitmentCRUDProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    status: 'pending',
    review_notes: '',
  });

  const getProfile = (applicantId: string) => {
    return profiles.find((p) => p.id === applicantId);
  };

  const handleViewOpen = (application: Application) => {
    setSelectedApplication(application);
    setViewDialogOpen(true);
  };

  const handleReviewOpen = (application: Application) => {
    setSelectedApplication(application);
    setReviewForm({
      status: application.status,
      review_notes: application.review_notes || '',
    });
    setReviewDialogOpen(true);
  };

  const handleSaveReview = async () => {
    if (!selectedApplication) return;

    setLoading(true);
    try {
      await recruitmentService.reviewApplication(selectedApplication.id, userId, {
        status: reviewForm.status as recruitmentService.ApplicationStatus,
        review_notes: reviewForm.review_notes,
      });
      toast.success('Application reviewed successfully');
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      await fetchApplications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to review application');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOpen = (application: Application) => {
    setSelectedApplication(application);
    setDeleteDialogOpen(true);
  };

  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;

    setLoading(true);
    try {
      await recruitmentService.deleteApplication(selectedApplication.id);
      toast.success('Application deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedApplication(null);
      await fetchApplications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete application');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const data = await recruitmentService.fetchApplications();
      onApplicationsChange(data as Application[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch applications');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">All Applications</h2>

      {/* Applications List */}
      <div className="space-y-3">
        {applications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No applications found</p>
          </div>
        ) : (
          applications.map((application) => {
            const profile = getProfile(application.applicant_id);
            return (
              <div
                key={application.id}
                className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="font-medium">
                        {profile
                          ? `${profile.first_name} ${profile.last_name}`
                          : 'Unknown Applicant'}
                      </h3>
                    </div>
                    {profile?.student_id && (
                      <p className="text-xs text-muted-foreground">ID: {profile.student_id}</p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {application.statement}
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      {application.gpa && <span>GPA: {application.gpa}</span>}
                      <span>{new Date(application.created_at).toLocaleDateString()}</span>
                    </div>
                    {application.review_notes && (
                      <div className="text-xs mt-2 bg-muted/50 p-2 rounded-lg border border-border">
                        <span className="font-medium">Review Notes:</span>
                        <p className="mt-1">{application.review_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${statusColors[application.status] || ''}`}
                    >
                      {application.status.replace('_', ' ')}
                    </Badge>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOpen(application)}
                      >
                        <Eye size={14} />
                      </Button>
                      {application.status !== 'approved' &&
                        application.status !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewOpen(application)}
                          >
                            Review
                          </Button>
                        )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteOpen(application)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedApplication &&
                getProfile(selectedApplication.applicant_id)
                  ? `${getProfile(selectedApplication.applicant_id)?.first_name} ${
                      getProfile(selectedApplication.applicant_id)?.last_name
                    }`
                  : 'Application Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Student ID</Label>
                  <p className="text-sm mt-1">
                    {getProfile(selectedApplication.applicant_id)?.student_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">GPA</Label>
                  <p className="text-sm mt-1">{selectedApplication.gpa || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge
                  variant="outline"
                  className={`mt-2 text-xs capitalize ${
                    statusColors[selectedApplication.status] || ''
                  }`}
                >
                  {selectedApplication.status.replace('_', ' ')}
                </Badge>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Personal Statement</Label>
                <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">
                  {selectedApplication.statement}
                </div>
              </div>

              {selectedApplication.review_notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Review Notes</Label>
                  <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">
                    {selectedApplication.review_notes}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Applied</Label>
                <p className="text-sm mt-1">
                  {new Date(selectedApplication.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Personal Statement:</p>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg line-clamp-4">
                  {selectedApplication.statement}
                </p>
              </div>

              <div>
                <Label htmlFor="review-status">Status</Label>
                <Select
                  value={reviewForm.status}
                  onValueChange={(v) => setReviewForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger id="review-status">
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

              <div>
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Add review notes..."
                  rows={4}
                  value={reviewForm.review_notes}
                  onChange={(e) => setReviewForm((p) => ({ ...p, review_notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveReview} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Review'}
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
            <AlertDialogTitle>Delete Application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApplication}
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
