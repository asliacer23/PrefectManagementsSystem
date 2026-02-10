import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Star, BarChart3 } from 'lucide-react';
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

interface EvaluationsViewProps {
  evaluations: Evaluation[];
  onEvaluationsChange: (evaluations: Evaluation[]) => void;
  userId: string;
  isAdmin: boolean;
  profiles: Profile[];
  academicYears: AcademicYear[];
}

export default function EvaluationsView({
  evaluations,
  userId,
  isAdmin,
  profiles,
  academicYears,
}: EvaluationsViewProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('all');

  // Filter evaluations
  const filteredEvaluations = useMemo(() => {
    let result = isAdmin
      ? evaluations
      : evaluations.filter((e) => e.prefect_id === userId);

    // Rating filtering
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      result = result.filter((e) => e.rating === rating);
    }

    // Academic year filtering
    if (academicYearFilter !== 'all') {
      result = result.filter((e) => e.academic_year_id === academicYearFilter);
    }

    return result;
  }, [evaluations, userId, isAdmin, ratingFilter, academicYearFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const filtered = isAdmin ? evaluations : evaluations.filter((e) => e.prefect_id === userId);
    const ratings = filtered.map((e) => e.rating);
    const average = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;

    return {
      total: filtered.length,
      average,
      excellent: filtered.filter((e) => e.rating === 5).length,
      good: filtered.filter((e) => e.rating === 4).length,
      average_rating: filtered.filter((e) => e.rating === 3).length,
      fair: filtered.filter((e) => e.rating === 2).length,
      poor: filtered.filter((e) => e.rating === 1).length,
    };
  }, [evaluations, userId, isAdmin]);

  const getPrefectName = (prefectId: string) => {
    const profile = profiles.find((p) => p.id === prefectId);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown';
  };

  const getPrefectProfile = (prefectId: string) => {
    return profiles.find((p) => p.id === prefectId);
  };

  const getEvaluatorName = (evaluatorId: string) => {
    const profile = profiles.find((p) => p.id === evaluatorId);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown';
  };

  const getEvaluatorProfile = (evaluatorId: string) => {
    return profiles.find((p) => p.id === evaluatorId);
  }

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

  const handleViewOpen = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Average: {stats.average}/5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Excellent (5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.excellent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.excellent / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Good (4)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.good}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.good / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Rating</label>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="2">2 - Fair</SelectItem>
                <SelectItem value="1">1 - Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Academic Year</label>
            <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.year_start}-{y.year_end} {y.semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Evaluations List */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluations</CardTitle>
          <CardDescription>Showing {filteredEvaluations.length} evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvaluations.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <BarChart3 size={40} className="mx-auto opacity-40 mb-2" />
                <p>No evaluations found</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="space-y-2">
                {filteredEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{getPrefectName(evaluation.prefect_id)}</p>
                      <p className="text-xs text-muted-foreground">
                        by {getEvaluatorName(evaluation.evaluator_id)} • {getAcademicYearName(evaluation.academic_year_id)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-current text-yellow-500" />
                        <Badge className={getRatingColor(evaluation.rating)}>
                          {evaluation.rating}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleViewOpen(evaluation)}
                      >
                        <Eye size={14} />
                      </Button>
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
