import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Database, Settings, Eye } from 'lucide-react';
import { toast } from 'sonner';
import DutiesCRUD from '../components/DutiesCRUD';
import DutiesView from '../components/DutiesView';
import * as dutiesService from '../services/dutiesService';
import { fetchDutiesFromBackend, seedDutiesFromBackend } from '@/features/shared/services/backendAppDataService';

interface DutyAssignment {
  id: string;
  prefect_id: string;
  title: string;
  description: string | null;
  duty_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: string;
  assigned_by: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function DutiesPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [duties, setDuties] = useState<DutyAssignment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchDutiesFromBackend();
      const allDuties = (data.duties ?? []) as DutyAssignment[];
      setDuties(isAdmin ? allDuties : allDuties.filter((duty) => duty.prefect_id === user?.id));
      setProfiles((data.profiles ?? []) as Profile[]);
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
      await seedDutiesFromBackend();
      await fetchData();
      toast.success('Duty seed data was added and fetched from the database.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed duties');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Duty Assignments"
        description="Manage and track duty assignments for prefects"
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
                <p className="text-muted-foreground">Loading duties...</p>
              </div>
            ) : (
              <DutiesView
                duties={duties}
                onDutiesChange={setDuties}
                userId={user?.id || ''}
                isAdmin={isAdmin}
              />
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading duties...</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6">
                <DutiesCRUD
                  duties={duties}
                  onDutiesChange={setDuties}
                  userId={user?.id || ''}
                  profiles={profiles}
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
            <DutiesView
              duties={duties}
              onDutiesChange={setDuties}
              userId={user.id}
              isAdmin={false}
            />
          ) : null}
        </div>
      )}
    </AppLayout>
  );
}
