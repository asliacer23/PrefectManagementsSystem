import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ReportRecordDetailsModal,
  findEventForSharedRecord,
} from '@/features/reports/components/ReportRecordDetailsModal';
import { ExternalIntegrationPanel } from '@/features/integrations/components/ExternalIntegrationPanel';
import {
  dispatchPrefectDepartmentFlowFromDatabase,
  getGuidanceDisciplineFeedFromDatabase,
  getHrConductFeedFromDatabase,
  getPrefectRecentIntegrationEventsFromDatabase,
  getPrefectSharedRecordsFromDatabase,
  lookupRegistrarStudentsFromDatabase,
  type GuidanceDisciplineFeedRecord,
  type PrefectIntegrationEvent,
  type PrefectSharedRecord,
} from '@/features/integrations/services/databaseIntegrationService';
import { toast } from 'sonner';
import {
  BarChart3, FileText, AlertTriangle, ClipboardList, Calendar,
  Users, TrendingUp, CheckCircle, Clock, User, Bell, LogIn, Award, Eye
} from 'lucide-react';
import { SystemStats, fetchSystemStats, fetchCriticalIssues } from '../services/analyticsService';

interface CriticalIssues {
  unresolvedIncidents: any[];
  pendingComplaints: any[];
}

function toComparableValue(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase();
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
  const [sharedRecords, setSharedRecords] = useState<PrefectSharedRecord[]>([]);
  const [guidanceFeed, setGuidanceFeed] = useState<GuidanceDisciplineFeedRecord[]>([]);
  const [recentEvents, setRecentEvents] = useState<PrefectIntegrationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportDetailsOpen, setReportDetailsOpen] = useState(false);
  const [reportDetailsRecord, setReportDetailsRecord] = useState<PrefectSharedRecord | null>(null);
  const [reportDetailsVariant, setReportDetailsVariant] = useState<'sent' | 'received'>('sent');

  const loadSharedRecords = async () => {
    const records = await getPrefectSharedRecordsFromDatabase(12);
    setSharedRecords(records);
  };

  const loadGuidanceFeed = async () => {
    const feed = await getGuidanceDisciplineFeedFromDatabase(100);
    setGuidanceFeed(feed);
  };

  const loadRecentEvents = async () => {
    const events = await getPrefectRecentIntegrationEventsFromDatabase(100);
    setRecentEvents(events);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, issuesData] = await Promise.all([
          fetchSystemStats(),
          fetchCriticalIssues(),
        ]);
        setStats(statsData);
        setCriticalIssues(issuesData);
        await Promise.all([loadSharedRecords(), loadGuidanceFeed(), loadRecentEvents()]);
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

  const findGuidanceFeedMatch = (record: PrefectSharedRecord) => {
    const recordReference = toComparableValue(record.external_reference || record.patient_code || record.clearance_reference);
    const recordStudentName = toComparableValue(record.patient_name);

    return guidanceFeed.find((item) => {
      const caseReference = toComparableValue(item.case_reference);
      const studentName = toComparableValue(item.student_name);

      const byReference =
        recordReference !== '' &&
        caseReference !== '' &&
        (recordReference === caseReference || recordReference.includes(caseReference) || caseReference.includes(recordReference));

      const byStudent = recordStudentName !== '' && studentName !== '' && recordStudentName === studentName;

      return byReference || byStudent;
    });
  };

  const findGuidanceEventStatus = (record: PrefectSharedRecord) => {
    const recordReference = toComparableValue(
      record.external_reference || record.patient_code || record.clearance_reference,
    );
    const recordCorrelation = toComparableValue(record.correlation_id);
    const recordClearanceRef = toComparableValue(record.clearance_reference);

    const matched = recentEvents.find((event) => {
      if (
        toComparableValue(event.source_department_key) !== 'prefect' ||
        toComparableValue(event.target_department_key) !== 'guidance'
      ) {
        return false;
      }

      const eventSourceRef = toComparableValue(event.source_record_id);
      const eventCorrelation = toComparableValue(event.correlation_id);

      const byCorrelation =
        recordCorrelation !== '' && eventCorrelation !== '' && recordCorrelation === eventCorrelation;

      const bySourceReference =
        recordReference !== '' &&
        eventSourceRef !== '' &&
        (recordReference === eventSourceRef ||
          recordReference.includes(eventSourceRef) ||
          eventSourceRef.includes(recordReference));

      const byClearanceReference =
        recordClearanceRef !== '' &&
        eventSourceRef !== '' &&
        (recordClearanceRef.includes(eventSourceRef) || eventSourceRef.includes(recordClearanceRef));

      return byCorrelation || bySourceReference || byClearanceReference;
    });

    return matched?.status || '';
  };

  const getSentReportDisplayStatus = (record: PrefectSharedRecord) => {
    const targetDepartment = toComparableValue(record.target_department_key || record.department_key);

    if (targetDepartment !== 'guidance') {
      return record.status || 'not yet';
    }

    const guidanceRecord = findGuidanceFeedMatch(record);
    if (guidanceRecord) {
      const actionTakenRaw = String(guidanceRecord.action_taken ?? '').trim();
      if (actionTakenRaw) {
        return actionTakenRaw;
      }
    }

    const eventStatus = findGuidanceEventStatus(record);
    if (eventStatus) {
      return eventStatus;
    }

    return record.status || 'not yet';
  };

  const openSentReportDetails = (record: PrefectSharedRecord) => {
    setReportDetailsVariant('sent');
    setReportDetailsRecord(record);
    setReportDetailsOpen(true);
  };

  const openReceivedReportDetails = (record: PrefectSharedRecord) => {
    setReportDetailsVariant('received');
    setReportDetailsRecord(record);
    setReportDetailsOpen(true);
  };

  const reportDetailsEvent =
    reportDetailsRecord ? findEventForSharedRecord(reportDetailsRecord, recentEvents) : null;

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

      <div className="mb-6">
        <ExternalIntegrationPanel
          title="External Reporting Integrations"
          description="Send complete Prefect reporting data to Guidance, PMED, or Clinic, or request support from HR."
          baseUrl=""
          apiKey=""
          onActionComplete={async (action, payload) => {
            if ((payload as { ok?: boolean } | null)?.ok) {
              await loadSharedRecords();
            }
            // TEMP DEBUG: show PMED bridge forwarding details in UI toast.
            if (action.key === 'discipline-statistics') {
              const result = (payload ?? {}) as Record<string, unknown>;
              const bridge = (result.pmed_bridge_response ?? {}) as Record<string, unknown>;
              const bridgeData = (bridge.data ?? {}) as Record<string, unknown>;
              const forwarded = String(result.pmed_forwarded ?? '').toLowerCase() === 'true';
              const reportReference =
                String(bridgeData.report_reference ?? bridgeData.external_reference ?? result.source_record_id ?? 'n/a');
              const intakeMode = String(bridgeData.intake_mode ?? 'n/a');
              const bridgeMessage = String(
                (bridge as Record<string, unknown>).message ??
                  (bridge as Record<string, unknown>).error ??
                  result.message ??
                  'No bridge message.',
              );

              toast.message(
                `TEMP DEBUG PMED: forwarded=${forwarded ? 'yes' : 'no'} | ref=${reportReference} | intake=${intakeMode}`,
                {
                  description: bridgeMessage,
                  duration: 10000,
                },
              );
            }
          }}
          fetchHrEmployees={async () => {
            const employees = await getHrConductFeedFromDatabase(100);
            return employees
              .filter((employee) =>
                String(employee.department_name || '').toLowerCase().includes('prefect'),
              )
              .map((employee) => ({
                employeeId: employee.employee_id,
                employeeNumber: employee.employee_number,
                employeeName: employee.employee_name,
                departmentName: employee.department_name,
                positionTitle: employee.position_title,
              }));
          }}
          resolveStudentName={async (studentId) => {
            const records = await lookupRegistrarStudentsFromDatabase(studentId, 1);
            const exactMatch = records.find((item) => item.student_no === studentId);
            return (exactMatch ?? records[0])?.student_name ?? null;
          }}
          actions={[
            {
              key: 'discipline-reports',
              title: 'Send to Guidance',
              description: 'Send discipline reports to Guidance.',
              badge: 'Guidance',
              mode: 'post',
              endpointLabel: 'Prefect to Guidance reporting route',
              run: async ({ studentNo, studentName, referenceNo, title, notes, status }) =>
                dispatchPrefectDepartmentFlowFromDatabase({
                  targetDepartmentKey: 'guidance',
                  eventCode: 'discipline_reports',
                  sourceRecordId: referenceNo || studentNo || 'reports-summary',
                  payload: {
                    student_no: studentNo,
                    student_name: studentName,
                    reference_no: referenceNo,
                    title: title || 'Prefect Discipline Report Summary',
                    notes,
                    status,
                    source_module: 'reports',
                    totals: {
                      complaints: stats.totalComplaints,
                      incidents: stats.totalIncidents,
                      duties: stats.totalDuties,
                    },
                    critical_counts: {
                      unresolved_incidents: criticalIssues.unresolvedIncidents.length,
                      pending_complaints: criticalIssues.pendingComplaints.length,
                    },
                  },
                }),
            },
            {
              key: 'discipline-statistics',
              title: 'Send Report to PMED',
              description: 'Send a Prefect discipline and incident report summary to PMED.',
              badge: 'PMED',
              mode: 'post',
              endpointLabel: 'Prefect to PMED reporting route',
              run: async ({ studentNo, studentName, referenceNo, title, notes, status }) =>
                dispatchPrefectDepartmentFlowFromDatabase({
                  targetDepartmentKey: 'pmed',
                  eventCode: 'discipline_statistics',
                  sourceRecordId: referenceNo || 'discipline-statistics',
                  payload: {
                    student_no: studentNo,
                    student_name: studentName,
                    reference_no: referenceNo,
                    title: title || 'Prefect Discipline and Incident Report',
                    notes,
                    status,
                    source_module: 'reports',
                    report_type: 'discipline_summary',
                    report_name: title || 'Prefect Discipline and Incident Report',
                    owner_name: 'Prefect Management',
                    generated_at: new Date().toISOString(),
                    total_users: stats.totalUsers,
                    total_prefects: stats.totalPrefects,
                    total_complaints: stats.totalComplaints,
                    total_incidents: stats.totalIncidents,
                    total_duties: stats.totalDuties,
                    unresolved_incidents: criticalIssues.unresolvedIncidents.length,
                    pending_complaints: criticalIssues.pendingComplaints.length,
                  },
                }),
            },
            {
              key: 'reports-to-clinic',
              title: 'Send Health Report to Clinic',
              description:
                'Send health-related incident summaries and discipline metrics to the Clinic for medical follow-up.',
              badge: 'Clinic',
              mode: 'post',
              endpointLabel: 'Prefect to Clinic reporting route',
              run: async ({ studentNo, studentName, referenceNo, title, notes, status }) =>
                dispatchPrefectDepartmentFlowFromDatabase({
                  targetDepartmentKey: 'clinic',
                  eventCode: 'incident_reports',
                  sourceRecordId: referenceNo || studentNo || 'reports-clinic-summary',
                  payload: {
                    student_no: studentNo,
                    student_name: studentName,
                    reference_no: referenceNo,
                    title: title || 'Prefect Health & Incident Summary',
                    notes,
                    status,
                    source_module: 'reports',
                    report_type: 'prefect_reports_health_summary',
                    report_name: title || 'Prefect Health & Incident Summary',
                    owner_name: 'Prefect Management',
                    generated_at: new Date().toISOString(),
                    health_related: true,
                    handoff_type: 'health_incident',
                    routing: 'clinic_follow_up',
                    total_users: stats.totalUsers,
                    total_prefects: stats.totalPrefects,
                    total_complaints: stats.totalComplaints,
                    total_incidents: stats.totalIncidents,
                    total_duties: stats.totalDuties,
                    unresolved_incidents: criticalIssues.unresolvedIncidents.length,
                    pending_complaints: criticalIssues.pendingComplaints.length,
                  },
                }),
            },
            {
              key: 'employee-request-hr',
              title: 'Request Employee to HR',
              description: 'Send an employee request to HR with concern details for review.',
              badge: 'HR',
              mode: 'post',
              endpointLabel: 'Prefect to HR employee request route',
              run: async ({ studentNo, studentName, referenceNo, title, notes, status, reasonCategory, selectedEmployee }) =>
                dispatchPrefectDepartmentFlowFromDatabase({
                  targetDepartmentKey: 'hr',
                  eventCode: 'employee_request',
                  sourceRecordId: selectedEmployee?.employeeId || referenceNo || studentNo || 'employee-request',
                  payload: {
                    employee_id: selectedEmployee?.employeeId || null,
                    employee_number: selectedEmployee?.employeeNumber || studentNo || null,
                    employee_name: selectedEmployee?.employeeName || studentName || null,
                    department_name: selectedEmployee?.departmentName || null,
                    position_title: selectedEmployee?.positionTitle || null,
                    reference_no: referenceNo,
                    title: title || 'Prefect Employee Request',
                    concern: reasonCategory || 'Other concern',
                    reason_category: reasonCategory || 'Other concern',
                    reason: notes,
                    notes,
                    status,
                    source_module: 'reports',
                    request_type: 'employee_request',
                  },
                }),
            },
          ]}
        />
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Successful Sent Reports</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Prefect reports successfully sent to connected departments.
            </p>
          </div>
          <Badge variant="outline">
            {
              sharedRecords.filter(
                (record) => record.source_department_key === 'prefect' && ['completed', 'acknowledged', 'received', 'sent'].includes((record.status || '').toLowerCase()),
              ).length
            } successful
          </Badge>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Target Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right w-[100px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sharedRecords
                .filter((record) => record.source_department_key === 'prefect')
                .slice(0, 8)
                .map((record) => (
                  <TableRow key={`${record.clearance_reference}-${record.id}`}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={record.clearance_reference}>
                      {record.clearance_reference}
                    </TableCell>
                    <TableCell>{record.patient_name || 'N/A'}</TableCell>
                    <TableCell>{record.target_department_key || record.department_name || 'N/A'}</TableCell>
                    <TableCell>{getSentReportDisplayStatus(record)}</TableCell>
                    <TableCell>{new Date(record.updated_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openSentReportDetails(record)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {sharedRecords.filter((record) => record.source_department_key === 'prefect').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No sent report records yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Received Reports (Other Departments)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Reports received by Prefect from Guidance, PMED, Clinic, and other connected departments.
            </p>
          </div>
          <Badge variant="outline">
            {sharedRecords.filter((record) => record.target_department_key === 'prefect').length} received
          </Badge>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Source Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right w-[100px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sharedRecords
                .filter((record) => record.target_department_key === 'prefect')
                .slice(0, 8)
                .map((record) => (
                  <TableRow key={`${record.clearance_reference}-${record.id}`}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={record.clearance_reference}>
                      {record.clearance_reference}
                    </TableCell>
                    <TableCell>{record.patient_name || 'N/A'}</TableCell>
                    <TableCell>{record.source_department_key || record.department_name || 'N/A'}</TableCell>
                    <TableCell>{record.status}</TableCell>
                    <TableCell>{new Date(record.updated_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openReceivedReportDetails(record)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {sharedRecords.filter((record) => record.target_department_key === 'prefect').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No received report records yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

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

      <ReportRecordDetailsModal
        open={reportDetailsOpen}
        onOpenChange={setReportDetailsOpen}
        record={reportDetailsRecord}
        matchedEvent={reportDetailsEvent}
        variant={reportDetailsVariant}
      />
    </AppLayout>
  );
}
