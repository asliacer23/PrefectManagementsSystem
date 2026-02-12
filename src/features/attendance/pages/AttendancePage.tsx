import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Eye } from 'lucide-react';
import AttendanceCRUD from '../components/AttendanceCRUD';
import AttendanceView from '../components/AttendanceView';
import * as attendanceService from '../services/attendanceService';

interface Attendance {
  id: string;
  prefect_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AttendancePage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attendanceData, prefectsData] = await Promise.all([
        attendanceService.fetchAttendance(),
        attendanceService.fetchPrefects(),
      ]);
      setAttendance(attendanceData as Attendance[]);
      setProfiles(prefectsData as Profile[]);
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
        title="Attendance"
        description="Track and manage attendance records"
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
                <p className="text-muted-foreground">Loading attendance records...</p>
              </div>
            ) : (
              <AttendanceView
                attendance={attendance}
                onAttendanceChange={setAttendance}
                userId={user?.id || ''}
                isAdmin={isAdmin}
                profiles={profiles}
              />
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading attendance records...</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6">
                <AttendanceCRUD
                  attendance={attendance}
                  onAttendanceChange={setAttendance}
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
              <p className="text-muted-foreground">Loading attendance records...</p>
            </div>
          ) : (
            <AttendanceView
              attendance={attendance}
              onAttendanceChange={setAttendance}
              userId={user?.id || ''}
              isAdmin={false}
              profiles={profiles}
            />
          )}
        </div>
      )}
    </AppLayout>
  );
}
