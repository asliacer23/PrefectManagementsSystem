import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Eye } from 'lucide-react';
import EvaluationsCRUD from '../components/EvaluationsCRUD';
import EvaluationsView from '../components/EvaluationsView';
import * as evaluationsService from '../services/evaluationsService';

interface Evaluation {
  id: string;
  prefect_id: string;
  evaluator_id: string;
  academic_year_id: string | null;
  rating: number;
  comments: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AcademicYear {
  id: string;
  year_start: number;
  year_end: number;
  semester: string;
  is_current: boolean;
}

export default function EvaluationsPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evaluationsData, prefectsData, allProfilesData, academicYearsData] = await Promise.all([
        evaluationsService.fetchEvaluations(),
        evaluationsService.fetchPrefects(),
        evaluationsService.fetchAllProfiles(),
        evaluationsService.fetchAcademicYears(),
      ]);
      setEvaluations(evaluationsData as Evaluation[]);
      // Merge prefects and all profiles, preferring all profiles for name lookups
      const allProfiles = allProfilesData as Profile[];
      setProfiles(allProfiles);
      setAcademicYears(academicYearsData as AcademicYear[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AppLayout>
      <PageHeader
        title="Performance Evaluations"
        description="Manage prefect performance evaluations"
      />

      {/* Admin Tabs */}
      {isAdmin ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="view" className="gap-2">
              <Eye size={16} /> View
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <Settings size={16} /> Manage
            </TabsTrigger>
          </TabsList>

          {/* View Tab */}
          <TabsContent value="view" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading evaluations...</p>
              </div>
            ) : (
              <EvaluationsView
                evaluations={evaluations}
                onEvaluationsChange={setEvaluations}
                userId={user?.id || ''}
                isAdmin={isAdmin}
                profiles={profiles}
                academicYears={academicYears}
              />
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading evaluations...</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6">
                <EvaluationsCRUD
                  evaluations={evaluations}
                  onEvaluationsChange={setEvaluations}
                  userId={user?.id || ''}
                  profiles={profiles}
                  academicYears={academicYears}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* Non-Admin View */
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading evaluations...</p>
            </div>
          ) : (
            <EvaluationsView
              evaluations={evaluations}
              onEvaluationsChange={setEvaluations}
              userId={user?.id || ''}
              isAdmin={false}
              profiles={profiles}
              academicYears={academicYears}
            />
          )}
        </div>
      )}
    </AppLayout>
  );
}
