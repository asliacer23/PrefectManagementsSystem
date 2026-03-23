import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, AlertTriangle, ShieldCheck, ClipboardList, Calendar, UserPlus } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import StatsCard from '@/components/layout/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchDashboardFromBackend } from '@/features/shared/services/backendAppDataService';

interface DashboardStats {
  totalUsers: number;
  activePrefects: number;
  pendingComplaints: number;
  openIncidents: number;
  pendingApplications: number;
  todayDuties: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, activePrefects: 0, pendingComplaints: 0,
    openIncidents: 0, pendingApplications: 0, todayDuties: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const dashboard = await fetchDashboardFromBackend('admin');
      setStats(dashboard.stats);
      setRecentComplaints(dashboard.recentComplaints ?? []);
      setRecentIncidents(dashboard.recentIncidents ?? []);
      setUpcomingEvents(dashboard.upcomingEvents ?? []);
    };
    fetchAll();
  }, []);

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/15 text-warning', in_progress: 'bg-info/15 text-info',
    resolved: 'bg-success/15 text-success', dismissed: 'bg-muted text-muted-foreground',
  };
  const severityColors: Record<string, string> = {
    low: 'bg-muted text-muted-foreground', medium: 'bg-warning/15 text-warning',
    high: 'bg-accent/15 text-accent', critical: 'bg-destructive/15 text-destructive',
  };

  return (
    <AppLayout>
      <PageHeader title="Admin Dashboard" description="Overview of the Prefect Management System" />

      <div className="mb-6 flex flex-wrap gap-3">
        <Button asChild className="gap-2">
          <Link to="/integrations/hr-staff-request">
            <UserPlus className="h-4 w-4" />
            Request staff from HR
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard title="Total Users" value={stats.totalUsers} icon={<Users size={22} />} />
        <StatsCard title="Active Prefects" value={stats.activePrefects} icon={<ShieldCheck size={22} />} />
        <StatsCard title="Pending Complaints" value={stats.pendingComplaints} icon={<FileText size={22} />} trend={stats.pendingComplaints > 0 ? 'Needs attention' : 'All clear'} trendUp={stats.pendingComplaints === 0} />
        <StatsCard title="Open Incidents" value={stats.openIncidents} icon={<AlertTriangle size={22} />} />
        <StatsCard title="Pending Applications" value={stats.pendingApplications} icon={<ClipboardList size={22} />} />
        <StatsCard title="Today's Duties" value={stats.todayDuties} icon={<Calendar size={22} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Complaints */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={18} className="text-primary" /> Recent Complaints
          </h2>
          <div className="space-y-3">
            {recentComplaints.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.subject}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline" className={`text-xs capitalize flex-shrink-0 ${statusColors[c.status] || ''}`}>
                  {c.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
            {recentComplaints.length === 0 && <p className="text-sm text-muted-foreground">No complaints yet</p>}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-accent" /> Recent Incidents
          </h2>
          <div className="space-y-3">
            {recentIncidents.map(i => (
              <div key={i.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{i.title}</p>
                  <p className="text-xs text-muted-foreground">{i.location} • {new Date(i.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline" className={`text-xs capitalize flex-shrink-0 ${severityColors[i.severity] || ''}`}>
                  {i.severity}
                </Badge>
              </div>
            ))}
            {recentIncidents.length === 0 && <p className="text-sm text-muted-foreground">No incidents yet</p>}
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-secondary" /> Upcoming Events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcomingEvents.map(e => (
            <div key={e.id} className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="font-medium text-sm">{e.title}</p>
              <p className="text-xs text-muted-foreground mt-1">📅 {e.event_date} {e.start_time && `• ${e.start_time}`}</p>
              {e.location && <p className="text-xs text-muted-foreground">📍 {e.location}</p>}
            </div>
          ))}
          {upcomingEvents.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events</p>}
        </div>
      </div>
    </AppLayout>
  );
}
