import { useState } from 'react';
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
import { toast } from 'sonner';
import { Plus, AlertTriangle, MapPin, Eye } from 'lucide-react';
import * as incidentsService from '../services/incidentsService';

const severityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/15 text-warning',
  high: 'bg-accent/15 text-accent',
  critical: 'bg-destructive/15 text-destructive',
};

const severityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

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
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'low',
    location: '',
  });

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!form.description.trim()) {
      toast.error('Description is required');
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
      let data: Incident[];
      if (isAdmin) {
        data = (await incidentsService.fetchIncidents()) as Incident[];
      } else {
        data = (await incidentsService.fetchUserIncidents(userId)) as Incident[];
      }
      onIncidentsChange(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch incidents');
    }
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      filterSeverity === 'all' || incident.severity === filterSeverity;

    const matchesResolved =
      filterResolved === 'all' ||
      (filterResolved === 'resolved' && incident.is_resolved) ||
      (filterResolved === 'unresolved' && !incident.is_resolved);

    return matchesSearch && matchesSeverity && matchesResolved;
  });

  return (
    <div className="space-y-6">
      {/* Header with Submit Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">
          {isAdmin ? 'All Incidents' : 'My Incidents'}
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={16} className="mr-1" /> Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Incident title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm((p) => ({ ...p, severity: v }))}>
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Incident location"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the incident in detail"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setForm({ title: '', description: '', severity: 'low', location: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Reporting...' : 'Report'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="search">Search Incidents</Label>
          <Input
            id="search"
            placeholder="Search by title, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="severity-filter">Filter by Severity</Label>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger id="severity-filter" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="resolved-filter">Filter by Status</Label>
          <Select value={filterResolved} onValueChange={setFilterResolved}>
            <SelectTrigger id="resolved-filter" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-2">
            {searchTerm || filterSeverity !== 'all' || filterResolved !== 'all'
              ? 'No incidents match your filters'
              : 'No incidents reported'}
          </p>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground">
              Report an incident to get started
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{incident.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {incident.description}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    {incident.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {incident.location}
                      </span>
                    )}
                    <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${severityColors[incident.severity] || ''}`}
                    >
                      {incident.severity}
                    </Badge>
                    {incident.is_resolved && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-success/15 text-success"
                      >
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedIncident(incident);
                      setViewDialogOpen(true);
                    }}
                  >
                    <Eye size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedIncident?.title}</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Severity</Label>
                  <Badge
                    variant="outline"
                    className={`mt-2 text-xs capitalize ${
                      severityColors[selectedIncident.severity] || ''
                    }`}
                  >
                    {selectedIncident.severity}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge
                    variant="outline"
                    className={`mt-2 text-xs ${
                      selectedIncident.is_resolved
                        ? 'bg-success/15 text-success'
                        : 'bg-warning/15 text-warning'
                    }`}
                  >
                    {selectedIncident.is_resolved ? 'Resolved' : 'Unresolved'}
                  </Badge>
                </div>
              </div>

              {selectedIncident.location && (
                <div>
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <MapPin size={14} /> {selectedIncident.location}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">
                  {selectedIncident.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Reported</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedIncident.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Updated</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedIncident.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

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
