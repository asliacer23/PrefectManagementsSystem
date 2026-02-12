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
import { Plus, Edit, Trash2, Eye, Star } from 'lucide-react';
import { toast } from 'sonner';
import * as evaluationsService from '../services/evaluationsService';

interface Evaluation {
  id: string;
  prefect_id: string;
  evaluator_id: string;
  academic_year_id: string | null;
  rating: number;
  comments: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AcademicYear {
  id: string;
  year_start: number;
  year_end: number;
  semester: string;
  is_current: boolean;
}

interface EvaluationsCRUDProps {
  evaluations: Evaluation[];
  onEvaluationsChange: (evaluations: Evaluation[]) => void;
  userId: string;
  prefectProfiles: Profile[];
  adminProfiles: Profile[];
  academicYears: AcademicYear[];
}

export default function EvaluationsCRUD({
  evaluations,
  onEvaluationsChange,
  userId,
  prefectProfiles,
  adminProfiles,
  academicYears,
}: EvaluationsCRUDProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    prefect_id: '',
    evaluator_id: '',
    academic_year_id: 'none',
    rating: '5',
    comments: '',
  });

  const resetForm = () => {
    setFormData({
      prefect_id: '',
      evaluator_id: userId,
      academic_year_id: 'none',
      rating: '5',
      comments: '',
    });
    setSelectedEvaluation(null);
  };

  const handleCreateOpen = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEditOpen = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setFormData({
      prefect_id: evaluation.prefect_id,
      evaluator_id: evaluation.evaluator_id,
      academic_year_id: evaluation.academic_year_id || 'none',
      rating: evaluation.rating.toString(),
      comments: evaluation.comments || '',
    });
    setEditDialogOpen(true);
  };

  const handleViewOpen = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setViewDialogOpen(true);
  };

  const handleDeleteOpen = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.prefect_id || !formData.evaluator_id || !formData.rating) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const newEvaluation = await evaluationsService.createEvaluation({
        prefect_id: formData.prefect_id,
        evaluator_id: formData.evaluator_id,
        academic_year_id: formData.academic_year_id !== 'none' ? formData.academic_year_id : null,
        rating: parseInt(formData.rating),
        comments: formData.comments || null,
      });

      onEvaluationsChange([newEvaluation, ...evaluations]);
      toast.success('Evaluation created successfully');
      setCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedEvaluation) return;

    setLoading(true);
    try {
      const updated = await evaluationsService.updateEvaluation(
        selectedEvaluation.id,
        {
          rating: parseInt(formData.rating),
          comments: formData.comments || null,
          academic_year_id: formData.academic_year_id !== 'none' ? formData.academic_year_id : null,
        }
      );

      onEvaluationsChange(
        evaluations.map((e) => (e.id === selectedEvaluation.id ? updated : e))
      );
      toast.success('Evaluation updated successfully');
      setEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvaluation) return;

    setLoading(true);
    try {
      await evaluationsService.deleteEvaluation(selectedEvaluation.id);
      onEvaluationsChange(
        evaluations.filter((e) => e.id !== selectedEvaluation.id)
      );
      toast.success('Evaluation deleted successfully');
      setDeleteDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete evaluation');
    } finally {
      setLoading(false);
    }
  };

  const getPrefectName = (prefectId: string) => {
    const profile = prefectProfiles.find((p) => p.id === prefectId);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown';
  };

  const getPrefectProfile = (prefectId: string) => {
    return prefectProfiles.find((p) => p.id === prefectId);
  };

  const getEvaluatorName = (evaluatorId: string) => {
    const profile = adminProfiles.find((p) => p.id === evaluatorId);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown';
  };

  const getEvaluatorProfile = (evaluatorId: string) => {
    return adminProfiles.find((p) => p.id === evaluatorId);
  };

  const getAcademicYearName = (yearId: string | null) => {
    if (!yearId) return 'N/A';
    const year = academicYears.find((y) => y.id === yearId);
    return year ? `${year.year_start}-${year.year_end} ${year.semester}` : 'Unknown';
  };

  const getRatingColor = (rating: number) => {
    return evaluationsService.getRatingColor(rating);
  };

  const getRatingLabel = (rating: number) => {
    return evaluationsService.getRatingLabel(rating);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Manage Evaluations</h2>
          <p className="text-sm text-muted-foreground">Create, edit and delete performance evaluations</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleCreateOpen}>
              <Plus size={16} className="mr-2" /> New Evaluation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Evaluation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="prefect-select">Prefect</Label>
                <Select value={formData.prefect_id} onValueChange={(v) => setFormData({ ...formData, prefect_id: v })}>
                  <SelectTrigger id="prefect-select">
                    <SelectValue placeholder="Select a prefect" />
                  </SelectTrigger>
                  <SelectContent>
                    {prefectProfiles.map((p) => (
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
                <Label htmlFor="evaluator-select">Evaluator</Label>
                <Select value={formData.evaluator_id} onValueChange={(v) => setFormData({ ...formData, evaluator_id: v })}>
                  <SelectTrigger id="evaluator-select">
                    <SelectValue placeholder="Select evaluator" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminProfiles.map((p) => (
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
                <Label htmlFor="year-select">Academic Year</Label>
                <Select
                  value={formData.academic_year_id}
                  onValueChange={(v) => setFormData({ ...formData, academic_year_id: v })}
                >
                  <SelectTrigger id="year-select">
                    <SelectValue placeholder="Select academic year (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.year_start}-{y.year_end} {y.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rating-select">Rating</Label>
                <Select value={formData.rating} onValueChange={(v) => setFormData({ ...formData, rating: v })}>
                  <SelectTrigger id="rating-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                    <SelectItem value="4">4 - Good</SelectItem>
                    <SelectItem value="3">3 - Average</SelectItem>
                    <SelectItem value="2">2 - Fair</SelectItem>
                    <SelectItem value="1">1 - Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comments-input">Comments</Label>
                <Textarea
                  id="comments-input"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Evaluation comments..."
                />
              </div>

              <Button onClick={handleCreate} disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Evaluation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Evaluation Details</DialogTitle>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prefect</p>
                {getPrefectProfile(selectedEvaluation.prefect_id) ? (
                  <div className="mt-2">
                    <p className="font-semibold text-base">{getPrefectProfile(selectedEvaluation.prefect_id)?.first_name} {getPrefectProfile(selectedEvaluation.prefect_id)?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{getPrefectProfile(selectedEvaluation.prefect_id)?.email}</p>
                  </div>
                ) : (
                  <p className="text-base text-muted-foreground mt-1">Unknown</p>
                )}
              </div>
              <div className="border-b pb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Evaluator</p>
                {getEvaluatorProfile(selectedEvaluation.evaluator_id) ? (
                  <div className="mt-2">
                    <p className="font-semibold text-base">{getEvaluatorProfile(selectedEvaluation.evaluator_id)?.first_name} {getEvaluatorProfile(selectedEvaluation.evaluator_id)?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{getEvaluatorProfile(selectedEvaluation.evaluator_id)?.email}</p>
                  </div>
                ) : (
                  <p className="text-base text-muted-foreground mt-1">Unknown</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Academic Year</p>
                  <p className="font-medium mt-1">{getAcademicYearName(selectedEvaluation.academic_year_id)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rating</p>
                  <div className="mt-1">
                    <Badge className={getRatingColor(selectedEvaluation.rating)}>
                      {selectedEvaluation.rating} - {getRatingLabel(selectedEvaluation.rating)}
                    </Badge>
                  </div>
                </div>
              </div>
              {selectedEvaluation.comments && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comments</p>
                  <p className="font-medium text-sm mt-2">{selectedEvaluation.comments}</p>
                </div>
              )}
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</p>
                <p className="font-medium text-sm mt-1">{new Date(selectedEvaluation.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Evaluation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-year">Academic Year</Label>
              <Select
                value={formData.academic_year_id}
                onValueChange={(v) => setFormData({ ...formData, academic_year_id: v })}
              >
                <SelectTrigger id="edit-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.year_start}-{y.year_end} {y.semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-rating">Rating</Label>
              <Select value={formData.rating} onValueChange={(v) => setFormData({ ...formData, rating: v })}>
                <SelectTrigger id="edit-rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="3">3 - Average</SelectItem>
                  <SelectItem value="2">2 - Fair</SelectItem>
                  <SelectItem value="1">1 - Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-comments">Comments</Label>
              <Textarea
                id="edit-comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Evaluation comments..."
              />
            </div>

            <Button onClick={handleUpdate} disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Update Evaluation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Evaluation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the evaluation for{' '}
            {selectedEvaluation && getPrefectName(selectedEvaluation.prefect_id)}. This action cannot
            be undone.
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

      {/* Evaluations List */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluations</CardTitle>
          <CardDescription>Total: {evaluations.length} evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No evaluations yet. Create one to get started.</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="space-y-2">
                {evaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{getPrefectName(evaluation.prefect_id)}</p>
                      <p className="text-xs text-muted-foreground">
                        Evaluator: {getEvaluatorName(evaluation.evaluator_id)} • {getAcademicYearName(evaluation.academic_year_id)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-current text-yellow-500" />
                        <Badge className={getRatingColor(evaluation.rating)}>
                          {evaluation.rating}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleViewOpen(evaluation)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditOpen(evaluation)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteOpen(evaluation)}
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
