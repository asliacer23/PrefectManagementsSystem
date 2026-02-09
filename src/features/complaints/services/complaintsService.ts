import { supabase } from '@/integrations/supabase/client';

export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'dismissed';

interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  submitted_by: string;
  assigned_to?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateComplaintInput {
  subject: string;
  description: string;
}

interface UpdateComplaintInput {
  subject?: string;
  description?: string;
  status?: ComplaintStatus;
}

/**
 * Fetch all complaints
 */
export const fetchComplaints = async (): Promise<Complaint[]> => {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch complaints');
  }

  return data || [];
};

/**
 * Fetch user's own complaints
 */
export const fetchUserComplaints = async (userId: string): Promise<Complaint[]> => {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch complaints');
  }

  return data || [];
};

/**
 * Fetch a single complaint by ID
 */
export const fetchComplaintById = async (id: string): Promise<Complaint> => {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to fetch complaint');
  }

  return data;
};

/**
 * Fetch complaints by status
 */
export const fetchComplaintsByStatus = async (status: ComplaintStatus): Promise<Complaint[]> => {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch complaints');
  }

  return data || [];
};

/**
 * Create a new complaint
 */
export const createComplaint = async (userId: string, input: CreateComplaintInput): Promise<Complaint> => {
  if (!input.subject.trim()) {
    throw new Error('Complaint subject is required');
  }

  if (!input.description.trim()) {
    throw new Error('Complaint description is required');
  }

  const { data, error } = await supabase
    .from('complaints')
    .insert({
      subject: input.subject.trim(),
      description: input.description.trim(),
      status: 'pending',
      submitted_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create complaint');
  }

  return data;
};

/**
 * Update a complaint
 */
export const updateComplaint = async (id: string, input: UpdateComplaintInput): Promise<Complaint> => {
  if (input.subject !== undefined && !input.subject.trim()) {
    throw new Error('Complaint subject cannot be empty');
  }

  if (input.description !== undefined && !input.description.trim()) {
    throw new Error('Complaint description cannot be empty');
  }

  const updateData: UpdateComplaintInput = {};
  if (input.subject !== undefined) updateData.subject = input.subject.trim();
  if (input.description !== undefined) updateData.description = input.description.trim();
  if (input.status !== undefined) updateData.status = input.status;

  const { data, error } = await supabase
    .from('complaints')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update complaint');
  }

  return data;
};

/**
 * Delete a complaint
 */
export const deleteComplaint = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('complaints')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete complaint');
  }
};

/**
 * Update complaint status
 */
export const updateComplaintStatus = async (id: string, status: ComplaintStatus): Promise<Complaint> => {
  return updateComplaint(id, { status });
};

/**
 * Get complaints count by status
 */
export const getComplaintsStats = async (): Promise<Record<ComplaintStatus, number>> => {
  const statuses: ComplaintStatus[] = ['pending', 'in_progress', 'resolved', 'dismissed'];
  const stats: Record<ComplaintStatus, number> = {
    pending: 0,
    in_progress: 0,
    resolved: 0,
    dismissed: 0,
  };

  for (const status of statuses) {
    const { count, error } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (!error && count !== null) {
      stats[status] = count;
    }
  }

  return stats;
};

/**
 * Search complaints by subject or description
 */
export const searchComplaints = async (searchTerm: string): Promise<Complaint[]> => {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .or(`subject.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to search complaints');
  }

  return data || [];
};
