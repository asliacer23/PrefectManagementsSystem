import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  BarChart3, FileText, AlertTriangle, ClipboardList, Calendar,
  Users, TrendingUp, CheckCircle, Clock, User, Bell, LogIn, Award
} from 'lucide-react';
import { SystemStats, fetchSystemStats, fetchCriticalIssues } from '../services/analyticsService';

interface CriticalIssues {
  unresolvedIncidents: any[];
  pendingComplaints: any[];
}

export default function ReportsPage() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalPrefects: 0,
    totalFaculty: 0,
    totalStudents: 0,
    totalComplaints: 0,
    totalIncidents: 0,
    totalDuties: 0,
    totalWeeklyReports: 0,
    totalApplications: 0,
    totalEvaluations: 0,
    totalEvents: 0,
    totalAttendance: 0,
    totalGateLogsCount: 0,
    complaintsByStatus: {},
    incidentsBySeverity: {},
    dutiesByStatus: {},
    applicationsByStatus: {},
    attendanceByStatus: {},
    evaluationRatings: {},
    departmentCounts: {},
    eventCount: 0,
    eventAssignmentCount: 0,
  });
  const [criticalIssues, setCriticalIssues] = useState<CriticalIssues>({
    unresolvedIncidents: [],
    pendingComplaints: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, issuesData] = await Promise.all([
          fetchSystemStats(),
          fetchCriticalIssues(),
        ]);
        setStats(statsData);
        setCriticalIssues(issuesData);
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/15 text-warning border-warning/30',
    in_progress: 'bg-info/15 text-info border-info/30',
    resolved: 'bg-success/15 text-success border-success/30',
    dismissed: 'bg-muted text-muted-foreground border-border',
  };

  const severityColors: Record<string, string> = {
    low: 'bg-muted text-muted-foreground border-border',
    medium: 'bg-warning/15 text-warning border-warning/30',
    high: 'bg-accent/15 text-accent border-accent/30',
    critical: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  const dutyStatusColors: Record<string, string> = {
    assigned: 'bg-info/15 text-info border-info/30',
    completed: 'bg-success/15 text-success border-success/30',
    missed: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  const applicationStatusColors: Record<string, string> = {
    pending: 'bg-warning/15 text-warning border-warning/30',
    under_review: 'bg-info/15 text-info border-info/30',
    approved: 'bg-success/15 text-success border-success/30',
    rejected: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  const attendanceStatusColors: Record<string, string> = {
    present: 'bg-success/15 text-success border-success/30',
    absent: 'bg-destructive/15 text-destructive border-destructive/30',
    late: 'bg-warning/15 text-warning border-warning/30',
  };

  if (loading)
    return (
      <AppLayout>
        <PageHeader title="Reports & Analytics" />
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      </AppLayout>
    );

  return (
    <AppLayout>
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive system-wide reports and data overview"
      />

      {/* Critical Alerts */}
      {(criticalIssues.unresolvedIncidents.length > 0 ||
        criticalIssues.pendingComplaints.length > 0) && (
        <div className="mb-6 space-y-2">
          {criticalIssues.unresolvedIncidents.filter((i) => i.severity === 'critical').length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-2">
              <Bell size={16} className="text-destructive" />
              <span className="text-sm text-destructive">
                {criticalIssues.unresolvedIncidents.filter((i) => i.severity === 'critical').length} Critical incident(s)
                requiring immediate attention
              </span>
            </div>
          )}
          {criticalIssues.pendingComplaints.length > 0 && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning" />
              <span className="text-sm text-warning">
                {criticalIssues.pendingComplaints.length} Pending complaint(s) awaiting resolution
              </span>
            </div>
          )}
        </div>
      )}

      {/* User Statistics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">User Statistics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <Users className="mx-auto mb-2 text-primary" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalUsers}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <Award className="mx-auto mb-2 text-secondary" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalPrefects}</p>
            <p className="text-sm text-muted-foreground">Prefects</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <User className="mx-auto mb-2 text-info" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalFaculty}</p>
            <p className="text-sm text-muted-foreground">Faculty</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <ClipboardList className="mx-auto mb-2 text-accent" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalStudents}</p>
            <p className="text-sm text-muted-foreground">Students</p>
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Core Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <FileText className="mx-auto mb-2 text-primary" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalComplaints}</p>
            <p className="text-sm text-muted-foreground">Total Complaints</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <AlertTriangle className="mx-auto mb-2 text-accent" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalIncidents}</p>
            <p className="text-sm text-muted-foreground">Total Incidents</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <ClipboardList className="mx-auto mb-2 text-secondary" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalDuties}</p>
            <p className="text-sm text-muted-foreground">Duty Assignments</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <Calendar className="mx-auto mb-2 text-info" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalWeeklyReports}</p>
            <p className="text-sm text-muted-foreground">Weekly Reports</p>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Additional Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <TrendingUp className="mx-auto mb-2 text-teal-500" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalApplications}</p>
            <p className="text-sm text-muted-foreground">Applications</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <Award className="mx-auto mb-2 text-yellow-500" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalEvaluations}</p>
            <p className="text-sm text-muted-foreground">Evaluations</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <BarChart3 className="mx-auto mb-2 text-violet-500" size={24} />
            <p className="text-3xl font-display font-bold">{stats.eventCount}</p>
            <p className="text-sm text-muted-foreground">Events</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <CheckCircle className="mx-auto mb-2 text-lime-500" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalAttendance}</p>
            <p className="text-sm text-muted-foreground">Attendance Records</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <LogIn className="mx-auto mb-2 text-cyan-500" size={24} />
            <p className="text-3xl font-display font-bold">{stats.totalGateLogsCount}</p>
            <p className="text-sm text-muted-foreground">Gate Logs</p>
          </div>
        </div>
      </div>

      {/* Status Breakdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Complaints Breakdown */}
        {Object.keys(stats.complaintsByStatus).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-semibold mb-4">Complaints by Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.complaintsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`capitalize ${statusColors[status] || ''}`}
                  >
                    {status.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${
                            stats.totalComplaints > 0
                              ? (count / stats.totalComplaints) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incidents Breakdown */}
        {Object.keys(stats.incidentsBySeverity).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-semibold mb-4">Incidents by Severity</h3>
            <div className="space-y-3">
              {Object.entries(stats.incidentsBySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`capitalize ${severityColors[severity] || ''}`}
                  >
                    {severity}
                  </Badge>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-accent"
                        style={{
                          width: `${
                            stats.totalIncidents > 0
                              ? (count / stats.totalIncidents) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Duties Breakdown */}
        {Object.keys(stats.dutiesByStatus).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-semibold mb-4">Duties by Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.dutiesByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`capitalize ${dutyStatusColors[status] || ''}`}
                  >
                    {status}
                  </Badge>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-secondary"
                        style={{
                          width: `${
                            stats.totalDuties > 0
                              ? (count / stats.totalDuties) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applications Breakdown */}
        {Object.keys(stats.applicationsByStatus).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-semibold mb-4">Applications by Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.applicationsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`capitalize ${applicationStatusColors[status] || ''}`}
                  >
                    {status.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-teal-500"
                        style={{
                          width: `${
                            stats.totalApplications > 0
                              ? (count / stats.totalApplications) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Breakdown */}
        {Object.keys(stats.attendanceByStatus).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-semibold mb-4">Attendance by Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.attendanceByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`capitalize ${attendanceStatusColors[status] || ''}`}
                  >
                    {status}
                  </Badge>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-lime-500"
                        style={{
                          width: `${
                            stats.totalAttendance > 0
                              ? (count / stats.totalAttendance) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evaluation Ratings */}
        {Object.keys(stats.evaluationRatings).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display font-semibold mb-4">Evaluation Ratings Distribution</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                stats.evaluationRatings[rating] && (
                  <div key={rating} className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-info/15 text-info border-info/30">
                      ⭐ {rating} Stars
                    </Badge>
                    <div className="flex items-center gap-3 flex-1 mx-4">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-yellow-500"
                          style={{
                            width: `${
                              stats.totalEvaluations > 0
                                ? (stats.evaluationRatings[rating] / stats.totalEvaluations) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {stats.evaluationRatings[rating]}
                      </span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Department Distribution */}
      {Object.keys(stats.departmentCounts).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h3 className="font-display font-semibold mb-4">Department Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(stats.departmentCounts).map(([dept, count]) => (
              <div key={dept} className="text-center">
                <p className="text-2xl font-bold text-primary">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{dept}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display font-semibold mb-4">Events & Assignments</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-info">{stats.eventCount}</p>
            <p className="text-sm text-muted-foreground">Total Events</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-success">{stats.eventAssignmentCount}</p>
            <p className="text-sm text-muted-foreground">Event Assignments</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
