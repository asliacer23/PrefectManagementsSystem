import { useMemo, useState } from 'react';
import { AlertTriangle, Copy, Eye, Filter, MapPin, MoreHorizontal, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import * as incidentsService from '../services/incidentsService';

const severityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/15 text-warning',
  high: 'bg-accent/15 text-accent',
  critical: 'bg-destructive/15 text-destructive',
};

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

interface IncidentsViewProps {
  incidents: Incident[];
  onIncidentsChange: (incidents: Incident[]) => void;
  userId: string;
  isAdmin?: boolean;
}

export default function IncidentsView({
  incidents,
  onIncidentsChange,
  userId,
  isAdmin = false,
}: IncidentsViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterResolved, setFilterResolved] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', severity: 'low', location: '' });

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setLoading(true);
    try {
      await incidentsService.createIncident(userId, {
        title: form.title,
        description: form.description,
        severity: form.severity as incidentsService.IncidentSeverity,
        location: form.location,
      });
      toast.success('Incident reported successfully');
      setDialogOpen(false);
      setForm({ title: '', description: '', severity: 'low', location: '' });
      await fetchIncidents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to report incident');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      const data = isAdmin
        ? await incidentsService.fetchIncidents()
        : await incidentsService.fetchUserIncidents(userId);
      onIncidentsChange(data as Incident[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch incidents');
    }
  };

  const filteredIncidents = useMemo(() => incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity;
    const matchesResolved =
      filterResolved === 'all' ||
      (filterResolved === 'resolved' && incident.is_resolved) ||
      (filterResolved === 'unresolved' && !incident.is_resolved);
    return matchesSearch && matchesSeverity && matchesResolved;
  }), [filterResolved, filterSeverity, incidents, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{isAdmin ? 'All Incidents' : 'My Incidents'}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} className="mr-1" /> Report Incident</Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Report Incident</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm((p) => ({ ...p, severity: v }))}>
                  <SelectTrigger id="severity"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="location">Location</Label><Input id="location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} /></div>
              <div><Label htmlFor="description">Description</Label><Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Reporting...' : 'Report'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search incidents..." className="pl-9" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full"><Filter className="h-4 w-4" />Filter</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>Severity</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setFilterSeverity('all')}>All Severities</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterSeverity('low')}>Low</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterSeverity('medium')}>Medium</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterSeverity('high')}>High</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterSeverity('critical')}>Critical</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setFilterResolved('all')}>All Statuses</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterResolved('unresolved')}>Unresolved</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterResolved('resolved')}>Resolved</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No incidents match your filters</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell><div><p className="font-medium">{incident.title}</p><p className="truncate text-xs text-muted-foreground max-w-[280px]">{incident.description}</p></div></TableCell>
                  <TableCell><Badge variant="outline" className={`capitalize ${severityColors[incident.severity] || ''}`}>{incident.severity}</Badge></TableCell>
                  <TableCell><span className="inline-flex items-center gap-1 text-sm"><MapPin size={13} /> {incident.location || 'N/A'}</span></TableCell>
                  <TableCell><Badge variant="outline" className={incident.is_resolved ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}>{incident.is_resolved ? 'Resolved' : 'Unresolved'}</Badge></TableCell>
                  <TableCell>{new Date(incident.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedIncident(incident); setViewDialogOpen(true); }}><Eye size={14} />View</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl">
                          <DropdownMenuItem onClick={() => { setSelectedIncident(incident); setViewDialogOpen(true); }}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(incident.title)}><Copy className="mr-2 h-4 w-4" />Copy Title</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{selectedIncident?.title}</DialogTitle></DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div><Label className="text-xs text-muted-foreground">Severity</Label><Badge variant="outline" className={`mt-2 capitalize ${severityColors[selectedIncident.severity] || ''}`}>{selectedIncident.severity}</Badge></div>
                <div><Label className="text-xs text-muted-foreground">Status</Label><Badge variant="outline" className={`mt-2 ${selectedIncident.is_resolved ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>{selectedIncident.is_resolved ? 'Resolved' : 'Unresolved'}</Badge></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">Description</Label><div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">{selectedIncident.description}</div></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
