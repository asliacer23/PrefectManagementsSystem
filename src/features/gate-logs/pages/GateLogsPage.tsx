import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Eye } from 'lucide-react';
import GateLogsCRUD from '../components/GateLogsCRUD';
import GateLogsView from '../components/GateLogsView';
import * as gateLogsService from '../services/gateLogsService';

interface GateAssistanceLog {
  id: string;
  prefect_id: string;
  log_date: string;
  time_in: string;
  time_out: string | null;
  notes: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

export default function GateLogsPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [logs, setLogs] = useState<GateAssistanceLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsData, profilesData] = await Promise.all([
        gateLogsService.fetchGateLogs(),
        gateLogsService.fetchPrefects(),
      ]);
      setLogs(logsData as GateAssistanceLog[]);
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
        title="Gate Assistance Logs"
        description="Track and manage gate assistance records"
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
                <p className="text-muted-foreground">Loading gate logs...</p>
              </div>
            ) : (
              <GateLogsView
                logs={logs}
                onLogsChange={setLogs}
                userId={user?.id || ''}
                isAdmin={isAdmin}
              />
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading gate logs...</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6">
                <GateLogsCRUD
                  logs={logs}
                  onLogsChange={setLogs}
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
            <GateLogsView
              logs={logs}
              onLogsChange={setLogs}
              userId={user.id}
              isAdmin={false}
            />
          ) : null}
        </div>
      )}
    </AppLayout>
  );
}
