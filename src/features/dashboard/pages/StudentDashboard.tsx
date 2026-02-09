import { useEffect, useState } from 'react';
import { FileText, BookOpen, UserCheck, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import StatsCard from '@/components/layout/StatsCard';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ myComplaints: 0, myApplications: 0, trainingMaterials: 0, upcomingEvents: 0 });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [mc, ma, tm, ue, rc, ev] = await Promise.all([
        supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('submitted_by', user.id),
        supabase.from('prefect_applications').select('id', { count: 'exact', head: true }).eq('applicant_id', user.id),
        supabase.from('training_materials').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('event_date', new Date().toISOString().split('T')[0]),
        supabase.from('complaints').select('*').eq('submitted_by', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('events').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date').limit(5),
      ]);
      setStats({
        myComplaints: mc.count || 0, myApplications: ma.count || 0,
        trainingMaterials: tm.count || 0, upcomingEvents: ue.count || 0,
      });
      if (rc.data) setRecentComplaints(rc.data);
      if (ev.data) setEvents(ev.data);
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
