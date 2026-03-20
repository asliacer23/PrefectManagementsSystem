import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Database } from 'lucide-react';
import * as weeklyReportsService from '../services/weeklyReportsService';
import WeeklyReportsView from '../components/WeeklyReportsView';
import { fetchWeeklyReportsFromBackend, seedWeeklyReportsFromBackend } from '@/features/shared/services/backendAppDataService';

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
  const [seeding, setSeeding] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await fetchWeeklyReportsFromBackend();
      const allReports = (data.reports ?? []) as WeeklyReport[];
      setReports(isAdmin ? allReports : allReports.filter((report) => report.prefect_id === user?.id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user, isAdmin]);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedWeeklyReportsFromBackend();
      await fetchReports();
      toast.success('Weekly report seed data was added and fetched from the database.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed weekly reports');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Weekly Reports"
        description="Submit and view weekly activity reports"
        actions={
          isAdmin ? (
            <Button type="button" variant="outline" onClick={handleSeedData} disabled={seeding} className="gap-2">
              <Database size={16} />
              {seeding ? 'Seeding...' : 'Load Seed Data'}
            </Button>
          ) : null
        }
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
