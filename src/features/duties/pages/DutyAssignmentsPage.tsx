import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, ClipboardList, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  assigned: 'bg-info/15 text-info',
  completed: 'bg-success/15 text-success',
  missed: 'bg-destructive/15 text-destructive',
};

type DutyStatus = 'assigned' | 'completed' | 'missed';

export default function DutyAssignmentsPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [duties, setDuties] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    prefect_id: '', title: '', description: '', duty_date: '',
    start_time: '', end_time: '', location: '', status: 'assigned' as DutyStatus,
  });

  const fetchAll = async () => {
    setLoading(true);
    const [d, p] = await Promise.all([
      supabase.from('duty_assignments').select('*').order('duty_date', { ascending: false }),
      supabase.from('profiles').select('id, first_name, last_name'),
    ]);
    if (d.data) setDuties(d.data);
    if (p.data) setProfiles(p.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getProfileName = (id: string) => {
    const p = profiles.find(pr => pr.id === id);
    return p ? `${p.first_name} ${p.last_name}` : 'Unknown';
  };

  const resetForm = () => {
    setForm({ prefect_id: '', title: '', description: '', duty_date: '', start_time: '', end_time: '', location: '', status: 'assigned' });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!user) return;
    if (editId) {
      const { error } = await supabase.from('duty_assignments').update({
        ...form, assigned_by: user.id,
      }).eq('id', editId);
      if (error) toast.error(error.message);
      else { toast.success('Duty updated'); setDialogOpen(false); resetForm(); fetchAll(); }
    } else {
      const { error } = await supabase.from('duty_assignments').insert({
        ...form, assigned_by: user.id,
      });
      if (error) toast.error(error.message);
      else { toast.success('Duty created'); setDialogOpen(false); resetForm(); fetchAll(); }
    }
  };

  const handleEdit = (d: any) => {
    setForm({
      prefect_id: d.prefect_id, title: d.title, description: d.description || '',
      duty_date: d.duty_date, start_time: d.start_time || '', end_time: d.end_time || '',
      location: d.location || '', status: d.status,
    });
    setEditId(d.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('duty_assignments').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Duty deleted'); fetchAll(); }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Duty Assignments"
        description="Daily duty schedules and assignments"
        actions={isAdmin ? (
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={16} className="mr-1" /> New Duty</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Create'} Duty Assignment</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div>
                  <Label>Assign To</Label>
                  <Select value={form.prefect_id} onValueChange={v => setForm(p => ({ ...p, prefect_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select prefect" /></SelectTrigger>
                    <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Date</Label><Input type="date" value={form.duty_date} onChange={e => setForm(p => ({ ...p, duty_date: e.target.value }))} /></div>
                  <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} /></div>
                  <div><Label>End Time</Label><Input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} /></div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as DutyStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                <Button onClick={handleSave} className="w-full">{editId ? 'Update' : 'Create'} Duty</Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : undefined}
      />

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      ) : duties.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No duty assignments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {duties.map(d => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{d.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Assigned to: {getProfileName(d.prefect_id)}</p>
                  {d.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.description}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span>📅 {d.duty_date}</span>
                    {d.start_time && <span>🕐 {d.start_time} - {d.end_time}</span>}
                    {d.location && <span>📍 {d.location}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs capitalize ${statusColors[d.status] || ''}`}>{d.status}</Badge>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(d)}><Edit size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(d.id)}><Trash2 size={14} /></Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
