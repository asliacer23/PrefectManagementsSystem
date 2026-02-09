import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Eye } from 'lucide-react';
import ComplaintsCRUD from '../components/ComplaintsCRUD';
import ComplaintsView from '../components/ComplaintsView';
import * as complaintsService from '../services/complaintsService';

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
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let data;
      if (isAdmin) {
        data = await complaintsService.fetchComplaints();
      } else if (user) {
        data = await complaintsService.fetchUserComplaints(user.id);
      } else {
        data = [];
      }
      setComplaints(data as Complaint[]);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  return (
    <AppLayout>
      <PageHeader
        title="Student Complaints"
        description="Submit and track complaints"
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
