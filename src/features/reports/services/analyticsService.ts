import { supabase } from '@/integrations/supabase/client';

export interface SystemStats {
  // User & Role Stats
  totalUsers: number;
  totalPrefects: number;
  totalFaculty: number;
  totalStudents: number;

  // Entity Counts
  totalComplaints: number;
  totalIncidents: number;
  totalDuties: number;
  totalWeeklyReports: number;
  totalApplications: number;
  totalEvaluations: number;
  totalEvents: number;
  totalAttendance: number;
  totalGateLogsCount: number;

  // Status Breakdowns
  complaintsByStatus: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
  dutiesByStatus: Record<string, number>;
  applicationsByStatus: Record<string, number>;

  // Attendance & Performance
  attendanceByStatus: Record<string, number>;
  evaluationRatings: Record<number, number>;

  // Department Stats
  departmentCounts: Record<string, number>;

  // Event Stats
  eventCount: number;
  eventAssignmentCount: number;
}

/**
 * Fetch comprehensive system statistics
 */
export const fetchSystemStats = async (): Promise<SystemStats> => {
  const stats: SystemStats = {
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
  };

  try {
    // Fetch all data in parallel
    const [
      profilesRes,
      rolesRes,
      complaintsRes,
      incidentsRes,
      dutiesRes,
      weeklyReportsRes,
      applicationsRes,
      evaluationsRes,
      attendanceRes,
      gateLogsRes,
      eventsRes,
      eventAssignmentsRes,
      departmentsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_roles').select('role'),
      supabase.from('complaints').select('status'),
      supabase.from('incident_reports').select('severity, is_resolved'),
      supabase.from('duty_assignments').select('status'),
      supabase.from('weekly_reports').select('id', { count: 'exact', head: true }),
      supabase.from('prefect_applications').select('status'),
      supabase.from('performance_evaluations').select('rating'),
      supabase.from('attendance').select('status'),
      supabase.from('gate_assistance_logs').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('event_assignments').select('id', { count: 'exact', head: true }),
      supabase.from('departments').select('*'),
    ]);

    // User counts
    stats.totalUsers = profilesRes.count || 0;

    // Role counts
    const roles = rolesRes.data || [];
    stats.totalPrefects = roles.filter((r) => r.role === 'prefect').length;
    stats.totalFaculty = roles.filter((r) => r.role === 'faculty').length;
    stats.totalStudents = roles.filter((r) => r.role === 'student').length;

    // Complaint status breakdown
    const complaints = complaintsRes.data || [];
    stats.totalComplaints = complaints.length;
    complaints.forEach((c) => {
      stats.complaintsByStatus[c.status] = (stats.complaintsByStatus[c.status] || 0) + 1;
    });

    // Incident severity breakdown
    const incidents = incidentsRes.data || [];
    stats.totalIncidents = incidents.length;
    incidents.forEach((i) => {
      stats.incidentsBySeverity[i.severity] = (stats.incidentsBySeverity[i.severity] || 0) + 1;
    });

    // Duty status breakdown
    const duties = dutiesRes.data || [];
    stats.totalDuties = duties.length;
    duties.forEach((d) => {
      stats.dutiesByStatus[d.status] = (stats.dutiesByStatus[d.status] || 0) + 1;
    });

    // Weekly reports
    stats.totalWeeklyReports = weeklyReportsRes.count || 0;

    // Applications
    const applications = applicationsRes.data || [];
    stats.totalApplications = applications.length;
    applications.forEach((a) => {
      stats.applicationsByStatus[a.status] = (stats.applicationsByStatus[a.status] || 0) + 1;
    });

    // Evaluations
    const evaluations = evaluationsRes.data || [];
    stats.totalEvaluations = evaluations.length;
    evaluations.forEach((e) => {
      if (e.rating) {
        stats.evaluationRatings[e.rating] = (stats.evaluationRatings[e.rating] || 0) + 1;
      }
    });

    // Attendance
    const attendanceData = attendanceRes.data || [];
    stats.totalAttendance = attendanceData.length;
    attendanceData.forEach((a) => {
      stats.attendanceByStatus[a.status] = (stats.attendanceByStatus[a.status] || 0) + 1;
    });

    // Gate logs
    stats.totalGateLogsCount = gateLogsRes.count || 0;

    // Events
    stats.eventCount = eventsRes.count || 0;
    stats.eventAssignmentCount = eventAssignmentsRes.count || 0;

    // Department counts
    const departments = departmentsRes.data || [];
    departments.forEach((d) => {
      stats.departmentCounts[d.name] = 0;
    });

    // Get user count per department
    if (profilesRes.data) {
      profilesRes.data.forEach((p: any) => {
        if (p.department && stats.departmentCounts[p.department] !== undefined) {
          stats.departmentCounts[p.department]++;
        }
      });
    }

    return stats;
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return stats;
  }
};

/**
 * Fetch top performers (by evaluation rating)
 */
export const fetchTopPerformers = async (limit: number = 5) => {
  const { data, error } = await supabase
    .from('performance_evaluations')
    .select('prefect_id, rating')
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || 'Failed to fetch top performers');
  }

  return data || [];
};

/**
 * Fetch prefect activity summary
 */
export const fetchPrefectActivitySummary = async () => {
  const { data: prefects, error } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'prefect');

  if (error) {
    throw new Error(error.message || 'Failed to fetch prefect activity');
  }

  const prefectIds = (prefects || []).map((p) => p.user_id);
  const summary: Record<string, any> = {};

  for (const prefectId of prefectIds) {
    const [duties, reports, evaluations] = await Promise.all([
      supabase.from('duty_assignments').select('*', { count: 'exact', head: true }).eq('prefect_id', prefectId),
      supabase.from('weekly_reports').select('*', { count: 'exact', head: true }).eq('prefect_id', prefectId),
      supabase.from('performance_evaluations').select('rating').eq('prefect_id', prefectId),
    ]);

    const avgRating =
      (evaluations.data || []).length > 0
        ? (evaluations.data || []).reduce((sum: number, e: any) => sum + (e.rating || 0), 0) /
          (evaluations.data || []).length
        : 0;

    summary[prefectId] = {
      dutyCount: duties.count || 0,
      reportCount: reports.count || 0,
      avgRating: avgRating.toFixed(2),
    };
  }

  return summary;
};

/**
 * Fetch incidents trend (last 7 days)
 */
export const fetchIncidentsTrend = async () => {
  const { data, error } = await supabase
    .from('incident_reports')
    .select('created_at, severity')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    throw new Error(error.message || 'Failed to fetch incidents trend');
  }

  const trend: Record<string, number> = {};
  (data || []).forEach((incident: any) => {
    const date = new Date(incident.created_at).toLocaleDateString();
    trend[date] = (trend[date] || 0) + 1;
  });

  return trend;
};

/**
 * Fetch complaints trend (last 7 days)
 */
export const fetchComplaintsTrend = async () => {
  const { data, error } = await supabase
    .from('complaints')
    .select('created_at, status')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    throw new Error(error.message || 'Failed to fetch complaints trend');
  }

  const trend: Record<string, number> = {};
  (data || []).forEach((complaint: any) => {
    const date = new Date(complaint.created_at).toLocaleDateString();
    trend[date] = (trend[date] || 0) + 1;
  });

  return trend;
};

/**
 * Fetch gate assistance logs trend (last 7 days)
 */
export const fetchGateLogsTrend = async () => {
  const { data, error } = await supabase
    .from('gate_assistance_logs')
    .select('log_date')
    .gte('log_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  if (error) {
    throw new Error(error.message || 'Failed to fetch gate logs trend');
  }

  const trend: Record<string, number> = {};
  (data || []).forEach((log: any) => {
    trend[log.log_date] = (trend[log.log_date] || 0) + 1;
  });

  return trend;
};

/**
 * Fetch unresolved critical issues
 */
export const fetchCriticalIssues = async () => {
  const [unresolvedIncidents, pendingComplaints] = await Promise.all([
    supabase
      .from('incident_reports')
      .select('*')
      .eq('is_resolved', false)
      .in('severity', ['high', 'critical']),
    supabase.from('complaints').select('*').eq('status', 'pending'),
  ]);

  return {
    unresolvedIncidents: unresolvedIncidents.data || [],
    pendingComplaints: pendingComplaints.data || [],
  };
};
