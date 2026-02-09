import { useEffect, useState } from 'react';
import { ClipboardList, DoorOpen, ShieldCheck, Calendar, BarChart3, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import StatsCard from '@/components/layout/StatsCard';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function PrefectDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ myDuties: 0, myGateLogs: 0, myAttendance: 0, upcomingEvents: 0, myReports: 0, myIncidents: 0 });
  const [todayDuties, setTodayDuties] = useState<any[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const fetchAll = async () => {
      const [md, mg, ma, ue, mr, mi, td, ri] = await Promise.all([
        supabase.from('duty_assignments').select('id', { count: 'exact', head: true }).eq('prefect_id', user.id),
        supabase.from('gate_assistance_logs').select('id', { count: 'exact', head: true }).eq('prefect_id', user.id),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('prefect_id', user.id),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('event_date', today),
        supabase.from('weekly_reports').select('id', { count: 'exact', head: true }).eq('prefect_id', user.id),
        supabase.from('incident_reports').select('id', { count: 'exact', head: true }).eq('reported_by', user.id),
        supabase.from('duty_assignments').select('*').eq('prefect_id', user.id).gte('duty_date', today).order('duty_date').limit(5),
        supabase.from('incident_reports').select('*').eq('reported_by', user.id).order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({
        myDuties: md.count || 0, myGateLogs: mg.count || 0, myAttendance: ma.count || 0,
        upcomingEvents: ue.count || 0, myReports: mr.count || 0, myIncidents: mi.count || 0,
      });
      if (td.data) setTodayDuties(td.data);
      if (ri.data) setRecentIncidents(ri.data);
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
