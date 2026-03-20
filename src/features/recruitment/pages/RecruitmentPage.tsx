import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Database, Settings, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RecruitmentCRUD from '../components/RecruitmentCRUD';
import RecruitmentView from '../components/RecruitmentView';
import * as recruitmentService from '../services/recruitmentService';
import { fetchRecruitmentFromBackend, seedRecruitmentFromBackend } from '@/features/shared/services/backendAppDataService';

interface Application {
  id: string;
  applicant_id: string;
  statement: string;
  gpa?: number;
  status: string;
  review_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
}

export default function RecruitmentPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [applications, setApplications] = useState<Application[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchRecruitmentFromBackend();
      const allApplications = (data.applications ?? []) as Application[];
      setApplications(isAdmin ? allApplications : allApplications.filter((application) => application.applicant_id === user?.id));
      setProfiles((data.profiles ?? []) as Profile[]);
      setCurrentAcademicYearId(data.currentAcademicYearId ?? null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedRecruitmentFromBackend();
      await fetchData();
      toast.success('Recruitment seed data was added and fetched from the database.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed recruitment data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Prefect Recruitment"
        description="Application and selection process"
        actions={
          isAdmin ? (
            <Button type="button" variant="outline" onClick={handleSeedData} disabled={seeding} className="gap-2">
              <Database size={16} />
              {seeding ? 'Seeding...' : 'Load Seed Data'}
            </Button>
          ) : null
        }
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
                <p className="text-muted-foreground">Loading applications...</p>
              </div>
            ) : (
              <RecruitmentView
                applications={applications}
                profiles={profiles}
                onApplicationsChange={setApplications}
                userId={user?.id || ''}
                isAdmin={isAdmin}
                academicYearId={currentAcademicYearId || ''}
              />
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading applications...</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6">
                <RecruitmentCRUD
                  applications={applications}
                  profiles={profiles}
                  onApplicationsChange={setApplications}
                  userId={user?.id || ''}
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
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : user ? (
            <RecruitmentView
              applications={applications}
              profiles={profiles}
              onApplicationsChange={setApplications}
              userId={user.id}
              isAdmin={false}
              academicYearId={currentAcademicYearId || ''}
            />
          ) : null}
        </div>
      )}
    </AppLayout>
  );
}
