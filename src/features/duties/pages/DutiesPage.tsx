import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Eye } from 'lucide-react';
import DutiesCRUD from '../components/DutiesCRUD';
import DutiesView from '../components/DutiesView';
import * as dutiesService from '../services/dutiesService';

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
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dutiesData, profilesData] = await Promise.all([
        dutiesService.fetchDuties(),
        dutiesService.fetchPrefects(),
      ]);
      setDuties(dutiesData as DutyAssignment[]);
      setProfiles(profilesData as Profile[]);
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
        title="Duty Assignments"
        description="Manage and track duty assignments for prefects"
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
