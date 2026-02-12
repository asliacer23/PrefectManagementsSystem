import { supabase } from '@/integrations/supabase/client';

export interface Evaluation {
  id: string;
  prefect_id: string;
  evaluator_id: string;
  academic_year_id: string | null;
  rating: number;
  comments: string | null;
  created_at: string;
}

export interface CreateEvaluationInput {
  prefect_id: string;
  evaluator_id: string;
  academic_year_id?: string | null;
  rating: number;
  comments?: string | null;
}

export interface UpdateEvaluationInput {
  rating?: number;
  comments?: string | null;
  academic_year_id?: string | null;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface AcademicYear {
  id: string;
  year_start: number;
  year_end: number;
  semester: string;
  is_current: boolean;
}

export interface EvaluationStats {
  totalEvaluations: number;
  averageRating: number;
  excellentCount: number;
  goodCount: number;
  averageCount: number;
  poorCount: number;
}

/**
 * Fetch all evaluations with optional filtering
 */
export async function fetchEvaluations(
  academicYearId?: string
): Promise<Evaluation[]> {
  let query = supabase
    .from('performance_evaluations')
    .select('*')
    .order('created_at', { ascending: false });

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as Evaluation[];
}

/**
 * Fetch evaluations for a specific prefect
 */
export async function fetchPrefectEvaluations(prefectId: string): Promise<Evaluation[]> {
  const { data, error } = await supabase
    .from('performance_evaluations')
    .select('*')
    .eq('prefect_id', prefectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Evaluation[];
}

/**
 * Fetch evaluations given by a specific assessor
 */
export async function fetchEvaluatorEvaluations(evaluatorId: string): Promise<Evaluation[]> {
  const { data, error } = await supabase
    .from('performance_evaluations')
    .select('*')
    .eq('evaluator_id', evaluatorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Evaluation[];
}

/**
 * Fetch a specific evaluation by ID
 */
export async function fetchEvaluationById(id: string): Promise<Evaluation> {
  const { data, error } = await supabase
    .from('performance_evaluations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Evaluation;
}

/**
 * Create a new evaluation
 */
export async function createEvaluation(input: CreateEvaluationInput): Promise<Evaluation> {
  // Validate rating
  if (input.rating < 1 || input.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const { data, error } = await supabase
    .from('performance_evaluations')
    .insert([
      {
        prefect_id: input.prefect_id,
        evaluator_id: input.evaluator_id,
        academic_year_id: input.academic_year_id || null,
        rating: input.rating,
        comments: input.comments || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Evaluation;
}

/**
 * Update an evaluation
 */
export async function updateEvaluation(
  id: string,
  input: UpdateEvaluationInput
): Promise<Evaluation> {
  if (input.rating && (input.rating < 1 || input.rating > 5)) {
    throw new Error('Rating must be between 1 and 5');
  }

  const { data, error } = await supabase
    .from('performance_evaluations')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Evaluation;
}

/**
 * Delete an evaluation
 */
export async function deleteEvaluation(id: string): Promise<void> {
  const { error } = await supabase
    .from('performance_evaluations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get evaluation statistics
 */
export async function getEvaluationStats(
  academicYearId?: string
): Promise<EvaluationStats> {
  let query = supabase.from('performance_evaluations').select('*');

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId);
  }

  const { data } = await query;
  const evaluations = (data || []) as Evaluation[];

  const total = evaluations.length;
  const ratings = evaluations.map((e) => e.rating);
  const average = total > 0 ? ratings.reduce((a, b) => a + b, 0) / total : 0;

  const excellentCount = evaluations.filter((e) => e.rating === 5).length;
  const goodCount = evaluations.filter((e) => e.rating === 4).length;
  const averageCount = evaluations.filter((e) => e.rating === 3).length;
  const poorCount = evaluations.filter((e) => e.rating <= 2).length;

  return {
    totalEvaluations: total,
    averageRating: Math.round(average * 10) / 10,
    excellentCount,
    goodCount,
    averageCount,
    poorCount,
  };
}

/**
 * Search evaluations by comments
 */
export async function searchEvaluations(query: string): Promise<Evaluation[]> {
  const { data, error } = await supabase
    .from('performance_evaluations')
    .select('*')
    .or(`comments.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Evaluation[];
}

/**
 * Fetch all prefect profiles (users with 'prefect' role)
 */
export async function fetchPrefects(): Promise<Profile[]> {
  // First, get all user IDs with 'prefect' role
  const { data: prefectRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'prefect');

  if (rolesError) throw rolesError;

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
    .order('first_name', { ascending: true });

  if (error) throw error;
  return (data || []) as Profile[];
}

/**
 * Fetch all admin profiles (users with 'admin' role)
 */
export async function fetchAdmins(): Promise<Profile[]> {
  // First, get all user IDs with 'admin' role
  const { data: adminRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if (rolesError) throw rolesError;

  if (!adminRoles || adminRoles.length === 0) {
    return [];
  }

  // Extract user IDs
  const adminIds = adminRoles.map(r => r.user_id);

  // Fetch profiles for these users
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', adminIds)
    .order('first_name', { ascending: true });

  if (error) throw error;
  return (data || []) as Profile[];
}

/**
 * Fetch all user profiles (for lookups)
 */
export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .order('first_name', { ascending: true });

  if (error) throw error;
  return (data || []) as Profile[];
}

/**
 * Fetch all academic years
 */
export async function fetchAcademicYears(): Promise<AcademicYear[]> {
  const { data, error } = await supabase
    .from('academic_years')
    .select('id, year_start, year_end, semester, is_current')
    .order('year_start', { ascending: false });

  if (error) throw error;
  return (data || []) as AcademicYear[];
}

/**
 * Fetch current academic year
 */
export async function fetchCurrentAcademicYear(): Promise<AcademicYear | null> {
  const { data, error } = await supabase
    .from('academic_years')
    .select('id, year_start, year_end, semester, is_current')
    .eq('is_current', true)
    .single();

  if (error || !data) return null;
  return data as AcademicYear;
}

/**
 * Get rating label
 */
export function getRatingLabel(rating: number): string {
  switch (rating) {
    case 5:
      return 'Excellent';
    case 4:
      return 'Good';
    case 3:
      return 'Average';
    case 2:
      return 'Fair';
    case 1:
      return 'Poor';
    default:
      return 'Unknown';
  }
}

/**
 * Get rating color based on value
 */
export function getRatingColor(rating: number): string {
  switch (rating) {
    case 5:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 4:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 3:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 2:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 1:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
