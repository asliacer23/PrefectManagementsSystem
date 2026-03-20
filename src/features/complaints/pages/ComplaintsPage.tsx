import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Database, Settings, Eye } from 'lucide-react';
import { toast } from 'sonner';
import ComplaintsCRUD from '../components/ComplaintsCRUD';
import ComplaintsView from '../components/ComplaintsView';
import * as complaintsService from '../services/complaintsService';
import { fetchComplaintsFromBackend, seedComplaintsFromBackend } from '@/features/shared/services/backendAppDataService';

interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: string;
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

export default function ComplaintsPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await fetchComplaintsFromBackend();
      const allComplaints = (data.complaints ?? []) as Complaint[];
      setComplaints(isAdmin ? allComplaints : allComplaints.filter((complaint) => complaint.submitted_by === user?.id));
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedComplaintsFromBackend();
      await fetchComplaints();
      toast.success('Complaint seed data was added and fetched from the database.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed complaints');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Student Complaints"
        description="Submit and track complaints"
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
                <p className="text-muted-foreground">Loading complaints...</p>
              </div>
            ) : (
              <ComplaintsView
                complaints={complaints}
                onComplaintsChange={setComplaints}
                userId={user?.id || ''}
                isAdmin={isAdmin}
              />
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading complaints...</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6">
                <ComplaintsCRUD
                  complaints={complaints}
                  onComplaintsChange={setComplaints}
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
              <p className="text-muted-foreground">Loading complaints...</p>
            </div>
          ) : user ? (
            <ComplaintsView
              complaints={complaints}
              onComplaintsChange={setComplaints}
              userId={user.id}
              isAdmin={false}
            />
          ) : null}
        </div>
      )}
    </AppLayout>
  );
}
