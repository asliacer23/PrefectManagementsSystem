import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, DoorOpen, ShieldCheck, Calendar, BarChart3, AlertTriangle, UserPlus } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import StatsCard from '@/components/layout/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchDashboardFromBackend } from '@/features/shared/services/backendAppDataService';
import { useAuth } from '@/hooks/useAuth';

export default function PrefectDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ myDuties: 0, myGateLogs: 0, myAttendance: 0, upcomingEvents: 0, myReports: 0, myIncidents: 0 });
  const [todayDuties, setTodayDuties] = useState<any[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const dashboard = await fetchDashboardFromBackend('prefect', user.id);
      setStats(dashboard.stats);
      setTodayDuties(dashboard.todayDuties ?? []);
      setRecentIncidents(dashboard.recentIncidents ?? []);
    };
    fetchAll();
  }, [user]);

  const dutyStatusColors: Record<string, string> = {
    assigned: 'bg-info/15 text-info', completed: 'bg-success/15 text-success', missed: 'bg-destructive/15 text-destructive',
  };

  return (
    <AppLayout>
      <PageHeader
        title={`Welcome, Prefect ${profile?.first_name || ''}!`}
        description="Your prefect dashboard — duties, logs, and reports"
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Button asChild className="gap-2">
          <Link to="/integrations/hr-staff-request">
            <UserPlus className="h-4 w-4" />
            Request staff from HR
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard title="My Duties" value={stats.myDuties} icon={<ClipboardList size={22} />} />
        <StatsCard title="Gate Logs" value={stats.myGateLogs} icon={<DoorOpen size={22} />} />
        <StatsCard title="Attendance" value={stats.myAttendance} icon={<ShieldCheck size={22} />} />
        <StatsCard title="Upcoming Events" value={stats.upcomingEvents} icon={<Calendar size={22} />} />
        <StatsCard title="Weekly Reports" value={stats.myReports} icon={<BarChart3 size={22} />} />
        <StatsCard title="My Incidents" value={stats.myIncidents} icon={<AlertTriangle size={22} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold mb-4">Upcoming Duties</h2>
          <div className="space-y-3">
            {todayDuties.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming duties</p>
            ) : todayDuties.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">📅 {d.duty_date} {d.start_time && `• 🕐 ${d.start_time}`} {d.location && `• 📍 ${d.location}`}</p>
                </div>
                <Badge variant="outline" className={`text-xs capitalize ${dutyStatusColors[d.status] || ''}`}>{d.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold mb-4">My Recent Incidents</h2>
          <div className="space-y-3">
            {recentIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No incidents reported</p>
            ) : recentIncidents.map(i => (
              <div key={i.id} className="py-2 border-b border-border/50 last:border-0">
                <p className="text-sm font-medium">{i.title}</p>
                <p className="text-xs text-muted-foreground">{i.location} • {new Date(i.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
