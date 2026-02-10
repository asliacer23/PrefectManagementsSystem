import { supabase } from '@/integrations/supabase/client';

export type DutyStatus = 'assigned' | 'completed' | 'missed';

interface DutyAssignment {
  id: string;
  prefect_id: string;
  title: string;
  description: string | null;
  duty_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  status: DutyStatus;
  assigned_by: string;
  created_at: string;
  updated_at: string;
}

interface CreateDutyInput {
  prefect_ids: string[]; // Array of prefect IDs
  title: string;
  description?: string;
  duty_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
}

interface UpdateDutyInput {
  title?: string;
  description?: string;
  duty_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  status?: DutyStatus;
}

/**
 * Fetch all duty assignments
 */
export const fetchDuties = async (): Promise<DutyAssignment[]> => {
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('*')
    .order('duty_date', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch duties');
  }

  return data || [];
};

/**
 * Fetch user's own duty assignments
 */
export const fetchUserDuties = async (userId: string): Promise<DutyAssignment[]> => {
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('*')
    .eq('prefect_id', userId)
    .order('duty_date', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch duties');
  }

  return data || [];
};

/**
 * Fetch a single duty by ID
 */
export const fetchDutyById = async (id: string): Promise<DutyAssignment> => {
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to fetch duty');
  }

  return data;
};

/**
 * Fetch duties by status
 */
export const fetchDutiesByStatus = async (status: DutyStatus): Promise<DutyAssignment[]> => {
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('*')
    .eq('status', status)
    .order('duty_date', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch duties');
  }

  return data || [];
};

/**
 * Create a new duty assignment
 */
export const createDuty = async (adminId: string, input: CreateDutyInput): Promise<DutyAssignment> => {
  if (!input.title.trim()) {
    throw new Error('Duty title is required');
  }

  if (!input.duty_date) {
    throw new Error('Duty date is required');
  }

  if (!input.prefect_ids || input.prefect_ids.length === 0) {
    throw new Error('At least one prefect is required');
  }

  const serializedPrefectIds = serializePrefectIds(input.prefect_ids);

  const { data, error } = await supabase
    .from('duty_assignments')
    .insert({
      prefect_id: serializedPrefectIds,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      duty_date: input.duty_date,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      location: input.location?.trim() || null,
      status: 'assigned',
      assigned_by: adminId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create duty');
  }

  return data;
};

/**
 * Update a duty assignment
 */
export const updateDuty = async (id: string, input: UpdateDutyInput): Promise<DutyAssignment> => {
  if (input.title !== undefined && !input.title.trim()) {
    throw new Error('Duty title cannot be empty');
  }

  const updateData: UpdateDutyInput = {};
  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.description !== undefined) updateData.description = input.description.trim() || null;
  if (input.duty_date !== undefined) updateData.duty_date = input.duty_date;
  if (input.start_time !== undefined) updateData.start_time = input.start_time || null;
  if (input.end_time !== undefined) updateData.end_time = input.end_time || null;
  if (input.location !== undefined) updateData.location = input.location.trim() || null;
  if (input.status !== undefined) updateData.status = input.status;

  const { data, error } = await supabase
    .from('duty_assignments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update duty');
  }

  return data;
};

/**
 * Delete a duty assignment
 */
export const deleteDuty = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('duty_assignments')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete duty');
  }
};

/**
 * Update duty status
 */
export const updateDutyStatus = async (id: string, status: DutyStatus): Promise<DutyAssignment> => {
  return updateDuty(id, { status });
};

/**
 * Get duties count by status
 */
export const getDutiesStats = async (): Promise<Record<DutyStatus, number>> => {
  const statuses: DutyStatus[] = ['assigned', 'completed', 'missed'];
  const stats: Record<DutyStatus, number> = {
    assigned: 0,
    completed: 0,
    missed: 0,
  };

  for (const status of statuses) {
    const { count, error } = await supabase
      .from('duty_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (!error && count !== null) {
      stats[status] = count;
    }
  }

  return stats;
};

/**
 * Search duties by title or location
 */
export const searchDuties = async (searchTerm: string): Promise<DutyAssignment[]> => {
  const { data, error } = await supabase
    .from('duty_assignments')
    .select('*')
    .or(`title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
    .order('duty_date', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to search duties');
  }

  return data || [];
};

/**
 * Fetch all prefect profiles for assignment (users with 'prefect' role)
 */
export const fetchPrefects = async (): Promise<Array<{ id: string; first_name: string; last_name: string; email: string }>> => {
  // First, get all user IDs with 'prefect' role
  const { data: prefectRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'prefect');

  if (rolesError) {
    throw new Error(rolesError.message || 'Failed to fetch prefect roles');
  }

  if (!prefectRoles || prefectRoles.length === 0) {
    return [];
  }

  // Extract user IDs
  const prefectIds = prefectRoles.map(r => r.user_id);

  // Fetch profiles for these users
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', prefectIds)
    .order('first_name');

  if (error) {
    throw new Error(error.message || 'Failed to fetch prefects');
  }

  return data || [];
};

/**
 * Parse prefect IDs from storage (handles both single UUID and JSON array)
 */
export const parsePrefectIds = (prefectIdStr: string): string[] => {
  if (!prefectIdStr) return [];

  try {
    // Try to parse as JSON array
    if (prefectIdStr.startsWith('[')) {
      const parsed = JSON.parse(prefectIdStr);
      return Array.isArray(parsed) ? parsed : [prefectIdStr];
    }
  } catch (e) {
    // Not JSON, treat as single ID
  }

  // Single UUID
  return [prefectIdStr];
};

/**
 * Serialize prefect IDs for storage (handles both single and multiple)
 */
export const serializePrefectIds = (ids: string[]): string => {
  if (ids.length === 0) throw new Error('At least one prefect is required');
  if (ids.length === 1) return ids[0];
  return JSON.stringify(ids);
};
