import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import PrefectDashboard from './PrefectDashboard';
import FacultyDashboard from './FacultyDashboard';
import StudentDashboard from './StudentDashboard';

export default function DashboardRouter() {
  const { primaryRole, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  switch (primaryRole) {
    case 'admin': return <AdminDashboard />;
    case 'faculty': return <FacultyDashboard />;
    case 'prefect': return <PrefectDashboard />;
    default: return <StudentDashboard />;
  }
}
