import { useEffect, useState } from 'react';
import { Users, FileText, AlertTriangle, ClipboardList, Calendar, GraduationCap } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import StatsCard from '@/components/layout/StatsCard';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function FacultyDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ complaints: 0, incidents: 0, applications: 0, events: 0, prefects: 0, evaluations: 0 });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [pendingApps, setPendingApps] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [c, i, a, e, p, ev, rc, pa] = await Promise.all([
        supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('incident_reports').select('id', { count: 'exact', head: true }).eq('is_resolved', false),
        supabase.from('prefect_applications').select('id', { count: 'exact', head: true }).in('status', ['pending', 'under_review']),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('event_date', new Date().toISOString().split('T')[0]),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'prefect'),
        supabase.from('performance_evaluations').select('id', { count: 'exact', head: true }),
        supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('prefect_applications').select('*').in('status', ['pending', 'under_review']).order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({
        complaints: c.count || 0, incidents: i.count || 0, applications: a.count || 0,
        events: e.count || 0, prefects: p.count || 0, evaluations: ev.count || 0,
      });
      if (rc.data) setRecentComplaints(rc.data);
      if (pa.data) setPendingApps(pa.data);
    };
    fetchAll();
  }, []);

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/15 text-warning', in_progress: 'bg-info/15 text-info',
    resolved: 'bg-success/15 text-success', under_review: 'bg-info/15 text-info',
  };

  return (
    <AppLayout>
      <PageHeader
        title={`Welcome, ${profile?.first_name || 'Faculty'}!`}
        description="Faculty Dashboard — Oversight and monitoring"
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard title="Pending Complaints" value={stats.complaints} icon={<FileText size={22} />} />
        <StatsCard title="Open Incidents" value={stats.incidents} icon={<AlertTriangle size={22} />} />
        <StatsCard title="Pending Applications" value={stats.applications} icon={<ClipboardList size={22} />} />
        <StatsCard title="Upcoming Events" value={stats.events} icon={<Calendar size={22} />} />
        <StatsCard title="Active Prefects" value={stats.prefects} icon={<Users size={22} />} />
        <StatsCard title="Total Evaluations" value={stats.evaluations} icon={<GraduationCap size={22} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold mb-4">Recent Complaints</h2>
          <div className="space-y-3">
            {recentComplaints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent complaints</p>
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
          <h2 className="font-display text-lg font-semibold mb-4">Pending Applications</h2>
          <div className="space-y-3">
            {pendingApps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending applications</p>
            ) : pendingApps.map(a => (
              <div key={a.id} className="py-2 border-b border-border/50 last:border-0">
                <p className="text-sm text-muted-foreground line-clamp-2">{a.statement}</p>
                <div className="flex gap-2 mt-1">
                  {a.gpa && <span className="text-xs text-muted-foreground">GPA: {a.gpa}</span>}
                  <Badge variant="outline" className={`text-xs capitalize ${statusColors[a.status] || ''}`}>{a.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
