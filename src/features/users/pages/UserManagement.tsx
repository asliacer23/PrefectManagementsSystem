import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  student_id: string | null;
  department: string | null;
  roles: string[];
}

type AppRole = 'admin' | 'prefect' | 'faculty' | 'student';

const roleBadgeMap: Record<string, string> = {
  admin: 'bg-accent/15 text-accent border-accent/30',
  faculty: 'bg-info/15 text-info border-info/30',
  prefect: 'bg-success/15 text-success border-success/30',
  student: 'bg-muted text-muted-foreground border-border',
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('student');

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email, student_id, department');
    const { data: allRoles } = await supabase.from('user_roles').select('user_id, role');

    if (profiles) {
      const usersWithRoles: UserRow[] = profiles.map(p => ({
        ...p,
        roles: allRoles?.filter(r => r.user_id === p.id).map(r => r.role) || [],
      }));
      setUsers(usersWithRoles);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const matchesSearch = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const handleAssignRole = async () => {
    if (!editingUser) return;
    const { error } = await supabase.from('user_roles').upsert({
      user_id: editingUser.id,
      role: newRole,
    }, { onConflict: 'user_id,role' });

    if (error) {
      toast.error('Failed to assign role');
    } else {
      toast.success(`Role "${newRole}" assigned successfully`);
      setEditingUser(null);
      fetchUsers();
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role as AppRole);
    if (error) {
      toast.error('Failed to remove role');
    } else {
      toast.success('Role removed');
      fetchUsers();
    }
  };

  return (
    <AppLayout>
      <PageHeader title="User Management" description="Manage users and role assignments" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="prefect">Prefect</SelectItem>
            <SelectItem value="student">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Roles</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No users found</td></tr>
              ) : filtered.map(user => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-muted-foreground">{user.email}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map(role => (
                        <Badge key={role} variant="outline" className={`text-xs capitalize ${roleBadgeMap[role] || ''}`}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingUser(user); setNewRole('student'); }}>
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Roles: {editingUser?.first_name} {editingUser?.last_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Current Roles</Label>
                            <div className="flex flex-wrap gap-2">
                              {editingUser?.roles.map(role => (
                                <Badge key={role} variant="outline" className={`capitalize ${roleBadgeMap[role] || ''}`}>
                                  {role}
                                  <button onClick={() => handleRemoveRole(editingUser.id, role)} className="ml-1.5 text-destructive hover:text-destructive/80">×</button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="faculty">Faculty</SelectItem>
                                <SelectItem value="prefect">Prefect</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button onClick={handleAssignRole}>
                              <UserPlus size={16} className="mr-1" /> Assign
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
