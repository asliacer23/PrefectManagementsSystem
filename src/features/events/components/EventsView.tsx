import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, Calendar } from 'lucide-react';
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

interface EventsViewProps {
  events: Event[];
  onEventsChange: (events: Event[]) => void;
  userId: string;
  isAdmin?: boolean;
  profiles: Profile[];
}

export default function EventsView({
  events,
  onEventsChange,
  userId,
  isAdmin = false,
  profiles,
}: EventsViewProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const today = new Date().toISOString().split('T')[0];
  
  let filteredEvents = events;

  // Filter by date
  if (dateFilter === 'upcoming') {
    filteredEvents = filteredEvents.filter((e) => e.event_date >= today);
  } else if (dateFilter === 'past') {
    filteredEvents = filteredEvents.filter((e) => e.event_date < today);
  }

  // Filter by search term
  if (searchTerm) {
    filteredEvents = filteredEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.event_date >= today).length,
  };

  const getCreatorName = (creatorId: string) => {
    const profile = profiles.find((p) => p.id === creatorId);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {isAdmin ? 'All Events' : 'Events'}
        </h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Events</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Upcoming</p>
            <p className="text-2xl font-semibold text-info">{stats.upcoming}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
          <div className="flex-1 w-full sm:w-auto">
            <Label htmlFor="search" className="text-sm font-medium">
              Search
            </Label>
            <Input
              id="search"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="w-full sm:w-auto">
            <Label htmlFor="date-filter" className="text-sm font-medium">
              Filter by Date
            </Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger id="date-filter" className="w-full sm:w-[200px] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? 'No events match your search' : 'No events available'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {getCreatorName(event.created_by)}
                  </p>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>📅 {new Date(event.event_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}</span>
                    {event.start_time && <span>🕐 {event.start_time}</span>}
                    {event.location && <span>📍 {event.location}</span>}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedEvent(event);
                    setViewDialogOpen(true);
                  }}
                >
                  <Eye size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Event Date</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedEvent.event_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created By</Label>
                  <p className="text-sm mt-1">{getCreatorName(selectedEvent.created_by)}</p>
                </div>
              </div>

              {(selectedEvent.start_time || selectedEvent.end_time) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Start Time</Label>
                    <p className="text-sm mt-1">{selectedEvent.start_time || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">End Time</Label>
                    <p className="text-sm mt-1">{selectedEvent.end_time || 'Not specified'}</p>
                  </div>
                </div>
              )}

              {selectedEvent.location && (
                <div>
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <p className="text-sm mt-1">{selectedEvent.location}</p>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">
                    {selectedEvent.description}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
