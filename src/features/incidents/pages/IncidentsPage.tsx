import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Database, Settings, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalIntegrationPanel } from '@/features/integrations/components/ExternalIntegrationPanel';
import IncidentsCRUD from '../components/IncidentsCRUD';
import IncidentsView from '../components/IncidentsView';
import * as incidentsService from '../services/incidentsService';
import { fetchIncidentsFromBackend, seedIncidentsFromBackend } from '@/features/shared/services/backendAppDataService';
import {
  dispatchPrefectDepartmentFlowFromDatabase,
  lookupRegistrarStudentsFromDatabase,
} from '@/features/integrations/services/databaseIntegrationService';

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
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await fetchIncidentsFromBackend();
      const allIncidents = (data.incidents ?? []) as Incident[];
      setIncidents(isAdmin ? allIncidents : allIncidents.filter((incident) => incident.reported_by === user?.id));
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [user]);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedIncidentsFromBackend();
      await fetchIncidents();
      toast.success('Incident seed data was added and fetched from the database.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed incidents');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Incident Reports"
        description="Report and track incidents"
        actions={
          isAdmin ? (
            <Button type="button" variant="outline" onClick={handleSeedData} disabled={seeding} className="gap-2">
              <Database size={16} />
              {seeding ? 'Seeding...' : 'Load Seed Data'}
            </Button>
          ) : null
        }
      />

      <div className="mb-6">
        <ExternalIntegrationPanel
          title="Incident Integrations"
          description="Send incident-related data directly to connected departments and fetch Registrar records when you need verification."
          baseUrl=""
          apiKey=""
          actions={[
            {
              key: 'student-personal-info',
              title: 'Fetch from Registrar',
              description: 'Receive student personal information from Registrar for discipline verification.',
              badge: 'Registrar',
              mode: 'fetch',
              endpointLabel: 'Registrar student directory',
              run: async ({ studentNo }) => {
                const records = await lookupRegistrarStudentsFromDatabase(studentNo, studentNo ? 5 : 3);
                return {
                  ok: true,
                  source: 'registrar.student_directory',
                  records,
                };
              },
            },
            {
              key: 'discipline-records',
              title: 'Send to Registrar',
              description: 'Send discipline records from Prefect to Registrar.',
              badge: 'Registrar',
              mode: 'post',
              endpointLabel: 'Prefect to Registrar discipline route',
              run: async ({ studentNo, referenceNo, title, notes, status }) =>
                dispatchPrefectDepartmentFlowFromDatabase({
                  targetDepartmentKey: 'registrar',
                  eventCode: 'discipline_records',
                  sourceRecordId: referenceNo || studentNo,
                  payload: {
                    student_no: studentNo,
                    reference_no: referenceNo,
                    title: title || 'Prefect Discipline Record',
                    notes,
                    status,
                    source_module: 'incidents',
                  },
                }),
            },
            {
              key: 'incident-reports',
              title: 'Send to Clinic',
              description: 'Send incident reports to Clinic through the shared department-flow registry.',
              badge: 'Clinic',
              mode: 'post',
              endpointLabel: 'Prefect to Clinic incident route',
              run: async ({ studentNo, referenceNo, title, notes, status }) =>
                dispatchPrefectDepartmentFlowFromDatabase({
                  targetDepartmentKey: 'clinic',
                  eventCode: 'incident_reports',
                  sourceRecordId: referenceNo || studentNo,
                  payload: {
                    student_no: studentNo,
                    reference_no: referenceNo,
                    title: title || 'Prefect Incident Report',
                    notes,
                    status,
                    source_module: 'incidents',
                  },
                }),
            },
          ]}
        />
      </div>

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
