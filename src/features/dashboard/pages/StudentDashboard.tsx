import { useEffect, useState } from 'react';
import { FileText, BookOpen, UserCheck, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import StatsCard from '@/components/layout/StatsCard';
import { Badge } from '@/components/ui/badge';
import { fetchDashboardFromBackend } from '@/features/shared/services/backendAppDataService';
import { useAuth } from '@/hooks/useAuth';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ myComplaints: 0, myApplications: 0, trainingMaterials: 0, upcomingEvents: 0 });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const dashboard = await fetchDashboardFromBackend('student', user.id);
      setStats(dashboard.stats);
      setRecentComplaints(dashboard.recentComplaints ?? []);
      setEvents(dashboard.events ?? []);
    };
    fetchAll();
  }, [user]);

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/15 text-warning', in_progress: 'bg-info/15 text-info',
    resolved: 'bg-success/15 text-success', dismissed: 'bg-muted text-muted-foreground',
  };

  return (
    <AppLayout>
      <PageHeader
        title={`Welcome, ${profile?.first_name || 'Student'}!`}
        description="Student Dashboard — Your overview"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="My Complaints" value={stats.myComplaints} icon={<FileText size={22} />} />
        <StatsCard title="My Applications" value={stats.myApplications} icon={<UserCheck size={22} />} />
        <StatsCard title="Training Materials" value={stats.trainingMaterials} icon={<BookOpen size={22} />} />
        <StatsCard title="Upcoming Events" value={stats.upcomingEvents} icon={<AlertTriangle size={22} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold mb-4">My Recent Complaints</h2>
          <div className="space-y-3">
            {recentComplaints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No complaints submitted yet</p>
            ) : recentComplaints.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.subject}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline" className={`text-xs capitalize ${statusColors[c.status] || ''}`}>
                  {c.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            ) : events.map(e => (
              <div key={e.id} className="py-2 border-b border-border/50 last:border-0">
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">📅 {e.event_date} {e.location && `• 📍 ${e.location}`}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
