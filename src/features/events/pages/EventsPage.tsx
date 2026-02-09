import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Eye } from 'lucide-react';
import EventsCRUD from '../components/EventsCRUD';
import EventsView from '../components/EventsView';
import * as eventsService from '../services/eventsService';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

export default function EventsPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [events, setEvents] = useState<Event[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsData, profilesData] = await Promise.all([
        eventsService.fetchEvents(),
        eventsService.fetchProfiles(),
      ]);
      setEvents(eventsData as Event[]);
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
        title="Events & Assembly"
        description="Event schedules and support assignments"
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
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            ) : (
              <EventsView
                events={events}
                onEventsChange={setEvents}
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
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6">
                <EventsCRUD
                  events={events}
                  onEventsChange={setEvents}
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
          ) : (
            <EventsView
              events={events}
              onEventsChange={setEvents}
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
