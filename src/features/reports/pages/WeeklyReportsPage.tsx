import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import * as weeklyReportsService from '../services/weeklyReportsService';
import WeeklyReportsView from '../components/WeeklyReportsView';

interface WeeklyReport {
  id: string;
  prefect_id: string;
  week_start: string;
  week_end: string;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  created_at: string;
}

export default function WeeklyReportsPage() {
  const { user, hasRole } = useAuth();
  const isPrefect = hasRole('prefect');
  const isAdmin = hasRole('admin');
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let data: WeeklyReport[];
      if (isAdmin) {
        data = await weeklyReportsService.fetchWeeklyReports();
      } else if (user) {
        data = await weeklyReportsService.fetchUserWeeklyReports(user.id);
      } else {
        data = [];
      }
      setReports(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user, isAdmin]);

  return (
    <AppLayout>
      <PageHeader
        title="Weekly Reports"
        description="Submit and view weekly activity reports"
      />

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      ) : user ? (
        <WeeklyReportsView
          reports={reports}
          onReportsChange={setReports}
          userId={user.id}
          isAdmin={isAdmin}
        />
      ) : (
        <p className="text-center text-muted-foreground py-12">Please log in to view reports</p>
      )}
    </AppLayout>
  );
}
