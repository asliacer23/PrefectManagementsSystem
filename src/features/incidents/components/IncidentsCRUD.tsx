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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Pencil, Trash2, Eye, MapPin } from 'lucide-react';
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

interface IncidentsCRUDProps {
  incidents: Incident[];
  onIncidentsChange: (incidents: Incident[]) => void;
}

export default function IncidentsCRUD({ incidents, onIncidentsChange }: IncidentsCRUDProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    severity: 'low',
    location: '',
    is_resolved: false,
  });

  const handleViewOpen = (incident: Incident) => {
    setSelectedIncident(incident);
    setViewDialogOpen(true);
  };

  const handleEditOpen = (incident: Incident) => {
    setSelectedIncident(incident);
    setEditFormData({
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      location: incident.location,
      is_resolved: incident.is_resolved,
    });
    setEditDialogOpen(true);
  };

  const handleToggleResolved = async (incidentId: string, currentState: boolean) => {
    setLoading(true);
    try {
      await incidentsService.updateIncident(incidentId, {
        is_resolved: !currentState,
      });
      toast.success(currentState ? 'Marked as unresolved' : 'Marked as resolved');
      await fetchIncidents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update incident');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedIncident) return;

    if (!editFormData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!editFormData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    setLoading(true);
    try {
      await incidentsService.updateIncident(selectedIncident.id, {
        title: editFormData.title,
        description: editFormData.description,
        severity: editFormData.severity as incidentsService.IncidentSeverity,
        location: editFormData.location,
        is_resolved: editFormData.is_resolved,
      });
      toast.success('Incident updated successfully');
      setEditDialogOpen(false);
      setSelectedIncident(null);
      await fetchIncidents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update incident');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOpen = (incident: Incident) => {
    setSelectedIncident(incident);
    setDeleteDialogOpen(true);
  };

  const handleDeleteIncident = async () => {
    if (!selectedIncident) return;

    setLoading(true);
    try {
      await incidentsService.deleteIncident(selectedIncident.id);
      toast.success('Incident deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedIncident(null);
      await fetchIncidents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete incident');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      const data = await incidentsService.fetchIncidents();
      onIncidentsChange(data as Incident[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch incidents');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">All Incidents</h2>

      {/* Incidents List */}
      <div className="space-y-3">
        {incidents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No incidents found</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.id}
              className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-medium truncate">{incident.title}</h3>
                    {incident.is_resolved && (
                      <Badge variant="outline" className="text-xs bg-success/15 text-success flex-shrink-0">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {incident.description}
                  </p>
                  <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                    {incident.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {incident.location}
                      </span>
                    )}
                    <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${severityColors[incident.severity] || ''}`}
                    >
                      {incident.severity}
                    </Badge>
                    <Button
                      size="sm"
                      variant={incident.is_resolved ? 'outline' : 'ghost'}
                      onClick={() => handleToggleResolved(incident.id, incident.is_resolved)}
                      disabled={loading}
                      className="text-xs"
                    >
                      {incident.is_resolved ? 'Unresolved' : 'Resolve'}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewOpen(incident)}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditOpen(incident)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteOpen(incident)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedIncident?.title}</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Badge variant="outline" className={`mt-2 text-xs ${selectedIncident.is_resolved ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
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

              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEditOpen(selectedIncident);
                  }}
                >
                  <Pencil size={14} className="mr-1" /> Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Incident</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Incident title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-severity">Severity</Label>
                <Select
                  value={editFormData.severity}
                  onValueChange={(v) => setEditFormData((p) => ({ ...p, severity: v }))}
                >
                  <SelectTrigger id="edit-severity">
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
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  placeholder="Incident location"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData((p) => ({ ...p, location: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Incident description"
                  rows={6}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Switch
                  id="edit-resolved"
                  checked={editFormData.is_resolved}
                  onCheckedChange={(v) => setEditFormData((p) => ({ ...p, is_resolved: v }))}
                />
                <Label htmlFor="edit-resolved" className="cursor-pointer flex-1">
                  Mark as Resolved
                </Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-full max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incident?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedIncident?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteIncident}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
