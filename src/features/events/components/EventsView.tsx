import { useMemo, useState } from 'react';
import { Calendar, Copy, Eye, Filter, MoreHorizontal, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

export default function EventsView({ events, isAdmin = false, profiles }: EventsViewProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const filteredEvents = useMemo(() => events.filter((event) => {
    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'upcoming' && event.event_date >= today) ||
      (dateFilter === 'past' && event.event_date < today);
    const matchesSearch =
      !searchTerm ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  }), [dateFilter, events, searchTerm, today]);

  const getCreatorName = (creatorId: string) => {
    const profile = profiles.find((profile) => profile.id === creatorId);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">{isAdmin ? 'All Events' : 'Events'}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full"><Filter className="h-4 w-4" />Filter</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl">
              <DropdownMenuLabel>Date</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setDateFilter('all')}>All Events</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter('upcoming')}>Upcoming</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter('past')}>Past</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setDateFilter('all'); setSearchTerm(''); }}>Reset Filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No events available</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      {event.description && <p className="truncate text-xs text-muted-foreground max-w-[300px]">{event.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(event.event_date).toLocaleDateString()}</TableCell>
                  <TableCell>{event.start_time ? `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}` : 'N/A'}</TableCell>
                  <TableCell>{event.location || 'N/A'}</TableCell>
                  <TableCell>{getCreatorName(event.created_by)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedEvent(event); setViewDialogOpen(true); }}><Eye size={14} />View</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl">
                          <DropdownMenuItem onClick={() => { setSelectedEvent(event); setViewDialogOpen(true); }}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(event.title)}><Copy className="mr-2 h-4 w-4" />Copy Title</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedEvent?.title}</DialogTitle></DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-muted-foreground">Event Date</Label><p className="text-sm mt-1">{new Date(selectedEvent.event_date).toLocaleDateString()}</p></div>
                <div><Label className="text-xs text-muted-foreground">Created By</Label><p className="text-sm mt-1">{getCreatorName(selectedEvent.created_by)}</p></div>
              </div>
              {selectedEvent.description && <div><Label className="text-xs text-muted-foreground">Description</Label><div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">{selectedEvent.description}</div></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
