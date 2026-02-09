import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Eye } from 'lucide-react';
import IncidentsCRUD from '../components/IncidentsCRUD';
import IncidentsView from '../components/IncidentsView';
import * as incidentsService from '../services/incidentsService';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  location: string;
  is_resolved: boolean;
  reported_by: string;
  created_at: string;
  updated_at: string;
}

export default function IncidentsPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      let data;
      if (isAdmin) {
        data = await incidentsService.fetchIncidents();
      } else if (user) {
        data = await incidentsService.fetchUserIncidents(user.id);
      } else {
        data = [];
      }
      setIncidents(data as Incident[]);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [user]);

  return (
    <AppLayout>
      <PageHeader
        title="Incident Reports"
        description="Report and track incidents"
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
                <p className="text-muted-foreground">Loading incidents...</p>
              </div>
            ) : (
              <IncidentsView
                incidents={incidents}
                onIncidentsChange={setIncidents}
                userId={user?.id || ''}
                isAdmin={isAdmin}
              />
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading incidents...</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6">
                <IncidentsCRUD
                  incidents={incidents}
                  onIncidentsChange={setIncidents}
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
              <p className="text-muted-foreground">Loading incidents...</p>
            </div>
          ) : user ? (
            <IncidentsView
              incidents={incidents}
              onIncidentsChange={setIncidents}
              userId={user.id}
              isAdmin={false}
            />
          ) : null}
        </div>
      )}
    </AppLayout>
  );
}
