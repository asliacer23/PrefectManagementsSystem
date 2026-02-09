import { supabase } from '@/integrations/supabase/client';

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

interface Application {
  id: string;
  applicant_id: string;
  statement: string;
  gpa?: number;
  status: ApplicationStatus;
  review_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
}

interface CreateApplicationInput {
  statement: string;
  gpa?: number;
  academic_year_id: string;
}

interface UpdateApplicationInput {
  statement?: string;
  gpa?: number;
  status?: ApplicationStatus;
  review_notes?: string;
}

interface ReviewApplicationInput {
  status: ApplicationStatus;
  review_notes: string;
}

/**
 * Fetch all prefect applications
 */
export const fetchApplications = async (): Promise<Application[]> => {
  const { data, error } = await supabase
    .from('prefect_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch applications');
  }

  return data || [];
};

/**
 * Fetch user's own application
 */
export const fetchUserApplication = async (userId: string): Promise<Application | null> => {
  const { data, error } = await supabase
    .from('prefect_applications')
    .select('*')
    .eq('applicant_id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    return null; // No application found
  }

  if (error) {
    throw new Error(error.message || 'Failed to fetch application');
  }

  return data;
};

/**
 * Fetch application by ID
 */
export const fetchApplicationById = async (id: string): Promise<Application> => {
  const { data, error } = await supabase
    .from('prefect_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to fetch application');
  }

  return data;
};

/**
 * Fetch applications by status
 */
export const fetchApplicationsByStatus = async (status: ApplicationStatus): Promise<Application[]> => {
  const { data, error } = await supabase
    .from('prefect_applications')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch applications');
  }

  return data || [];
};

/**
 * Create a new prefect application
 */
export const createApplication = async (userId: string, input: CreateApplicationInput): Promise<Application> => {
  if (!input.statement.trim()) {
    throw new Error('Personal statement is required');
  }

  if (!input.academic_year_id) {
    throw new Error('Academic year is required');
  }

  // Check if user already has an application for this academic year
  const existing = await supabase
    .from('prefect_applications')
    .select('*')
    .eq('applicant_id', userId)
    .eq('academic_year_id', input.academic_year_id)
    .maybeSingle();

  if (existing.data) {
    throw new Error('You have already submitted an application for this academic year');
  }

  const { data, error } = await supabase
    .from('prefect_applications')
    .insert({
      applicant_id: userId,
      academic_year_id: input.academic_year_id,
      statement: input.statement.trim(),
      gpa: input.gpa || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create application');
  }

  return data;
};

/**
 * Update application (user can only update their own pending/under_review applications)
 */
export const updateApplication = async (id: string, input: UpdateApplicationInput): Promise<Application> => {
  if (input.statement !== undefined && !input.statement.trim()) {
    throw new Error('Personal statement cannot be empty');
  }

  const updateData: UpdateApplicationInput = {};
  if (input.statement !== undefined) updateData.statement = input.statement.trim();
  if (input.gpa !== undefined) updateData.gpa = input.gpa;

  const { data, error } = await supabase
    .from('prefect_applications')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update application');
  }

  return data;
};

/**
 * Review application (admin only) - Update status and add review notes
 */
export const reviewApplication = async (
  id: string,
  userId: string,
  input: ReviewApplicationInput
): Promise<Application> => {
  if (!input.status) {
    throw new Error('Status is required');
  }

  const { data, error } = await supabase
    .from('prefect_applications')
    .update({
      status: input.status,
      review_notes: input.review_notes || null,
      reviewed_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to review application');
  }

  // If approved, grant prefect role
  if (input.status === 'approved') {
    const app = data;
    const { error: roleError } = await supabase.from('user_roles').upsert(
      {
        user_id: app.applicant_id,
        role: 'prefect',
      },
      { onConflict: 'user_id,role' }
    );

    if (roleError) {
      console.error('Error granting prefect role:', roleError);
      // Don't throw, as the application was already updated
    }
  }

  return data;
};

/**
 * Delete an application (admin only)
 */
export const deleteApplication = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('prefect_applications')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete application');
  }
};

/**
 * Get profile information
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, student_id')
    .eq('id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    return null;
  }

  if (error) {
    throw new Error(error.message || 'Failed to fetch profile');
  }

  return data;
};

/**
 * Fetch all profiles for getting applicant info
 */
export const fetchProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, student_id');

  if (error) {
    throw new Error(error.message || 'Failed to fetch profiles');
  }

  return data || [];
};

/**
 * Get applications statistics
 */
export const getApplicationsStats = async (): Promise<Record<ApplicationStatus, number>> => {
  const statuses: ApplicationStatus[] = ['pending', 'under_review', 'approved', 'rejected'];
  const stats: Record<ApplicationStatus, number> = {
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  };

  for (const status of statuses) {
    const { count, error } = await supabase
      .from('prefect_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (!error && count !== null) {
      stats[status] = count;
    }
  }

  return stats;
};

/**
 * Search applications by applicant name or statement
 */
export const searchApplications = async (searchTerm: string): Promise<Application[]> => {
  const { data, error } = await supabase
    .from('prefect_applications')
    .select('*')
    .or(`statement.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to search applications');
  }

  return data || [];
};

/**
 * Get approved prefects count
 */
export const getApprovedPrefectsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('prefect_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  if (error) {
    throw new Error(error.message || 'Failed to fetch prefects count');
  }

  return count || 0;
};
