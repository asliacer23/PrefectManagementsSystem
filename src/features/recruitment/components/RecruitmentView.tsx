import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, UserCheck, Eye } from 'lucide-react';
import * as recruitmentService from '../services/recruitmentService';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/15 text-warning',
  under_review: 'bg-info/15 text-info',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
};

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

interface RecruitmentViewProps {
  applications: Application[];
  profiles: Profile[];
  onApplicationsChange: (applications: Application[]) => void;
  userId: string;
  isAdmin?: boolean;
  academicYearId: string;
}

export default function RecruitmentView({
  applications,
  profiles,
  onApplicationsChange,
  userId,
  isAdmin = false,
  academicYearId,
}: RecruitmentViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    statement: '',
    gpa: '',
  });

  const userApplication = applications.find((app) => app.applicant_id === userId);
  const userProfile = profiles.find((p) => p.id === userId);

  const handleSubmit = async () => {
    if (!form.statement.trim()) {
      toast.error('Personal statement is required');
      return;
    }

    if (!academicYearId) {
      toast.error('Unable to determine current academic year');
      return;
    }

    setLoading(true);
    try {
      await recruitmentService.createApplication(userId, {
        statement: form.statement,
        gpa: form.gpa ? parseFloat(form.gpa) : undefined,
        academic_year_id: academicYearId,
      });
      toast.success('Application submitted successfully');
      setDialogOpen(false);
      setForm({ statement: '', gpa: '' });
      await fetchApplications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      let data;
      if (isAdmin) {
        const allApps = await recruitmentService.fetchApplications();
        data = allApps;
      } else {
        const allApps = await recruitmentService.fetchApplications();
        data = allApps;
      }
      onApplicationsChange(data as Application[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch applications');
    }
  };

  const getProfile = (applicantId: string) => {
    return profiles.find((p) => p.id === applicantId);
  };

  if (!isAdmin && userApplication) {
    // User already has an application, show their application detail view
    const profile = getProfile(userApplication.applicant_id);
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Application</h2>
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-medium mt-1">
                  {profile ? `${profile.first_name} ${profile.last_name}` : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge
                  variant="outline"
                  className={`mt-2 text-xs capitalize ${statusColors[userApplication.status] || ''}`}
                >
                  {userApplication.status.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">GPA</Label>
                <p className="text-sm mt-1">{userApplication.gpa || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Submitted</Label>
                <p className="text-sm mt-1">
                  {new Date(userApplication.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Personal Statement</Label>
              <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">
                {userApplication.statement}
              </div>
            </div>

            {userApplication.review_notes && (
              <div>
                <Label className="text-xs text-muted-foreground">Review Notes</Label>
                <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">
                  {userApplication.review_notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin && !userApplication) {
    // User hasn't applied yet
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Apply for Prefect</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Join our leadership team and make a positive impact on campus
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-1" /> Submit Application
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Apply for Prefect</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="statement">Personal Statement *</Label>
                  <Textarea
                    id="statement"
                    placeholder="Tell us why you want to be a prefect and what you'll bring to the role..."
                    rows={6}
                    value={form.statement}
                    onChange={(e) => setForm((p) => ({ ...p, statement: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="gpa">GPA (Optional)</Label>
                  <Input
                    id="gpa"
                    type="number"
                    placeholder="e.g., 3.8"
                    step="0.1"
                    min="0"
                    max="4.0"
                    value={form.gpa}
                    onChange={(e) => setForm((p) => ({ ...p, gpa: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setForm({ statement: '', gpa: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
          <UserCheck size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="font-semibold mb-2">Ready to apply?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Submit your application above to join our prefect team
          </p>
        </div>
      </div>
    );
  }

  // Admin view - show all applications
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">All Applications</h2>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserCheck size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => {
            const profile = getProfile(application.applicant_id);
            return (
              <div
                key={application.id}
                className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">
                      {profile
                        ? `${profile.first_name} ${profile.last_name}`
                        : 'Unknown Applicant'}
                    </h3>
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
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${statusColors[application.status] || ''}`}
                    >
                      {application.status.replace('_', ' ')}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedApplication(application);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
