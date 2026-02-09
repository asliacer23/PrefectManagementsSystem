import { supabase } from '@/integrations/supabase/client';

interface WeeklyReport {
  id: string;
  prefect_id: string;
  week_start: string;
  week_end: string;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  created_at: string;
}

interface CreateWeeklyReportInput {
  week_start: string;
  week_end: string;
  summary: string;
  achievements?: string;
  challenges?: string;
}

interface UpdateWeeklyReportInput {
  week_start?: string;
  week_end?: string;
  summary?: string;
  achievements?: string;
  challenges?: string;
}

/**
 * Fetch all weekly reports
 */
export const fetchWeeklyReports = async (): Promise<WeeklyReport[]> => {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .order('week_start', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch weekly reports');
  }

  return data || [];
};

/**
 * Fetch user's own weekly reports
 */
export const fetchUserWeeklyReports = async (userId: string): Promise<WeeklyReport[]> => {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('prefect_id', userId)
    .order('week_start', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch weekly reports');
  }

  return data || [];
};

/**
 * Fetch a single weekly report by ID
 */
export const fetchWeeklyReportById = async (id: string): Promise<WeeklyReport> => {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to fetch weekly report');
  }

  return data;
};

/**
 * Fetch weekly reports by date range
 */
export const fetchWeeklyReportsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<WeeklyReport[]> => {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .gte('week_start', startDate)
    .lte('week_end', endDate)
    .order('week_start', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch weekly reports');
  }

  return data || [];
};

/**
 * Fetch weekly reports for a specific prefect
 */
export const fetchPrefectWeeklyReports = async (prefectId: string): Promise<WeeklyReport[]> => {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('prefect_id', prefectId)
    .order('week_start', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch prefect weekly reports');
  }

  return data || [];
};

/**
 * Create a new weekly report
 */
export const createWeeklyReport = async (
  userId: string,
  input: CreateWeeklyReportInput
): Promise<WeeklyReport> => {
  if (!input.week_start) {
    throw new Error('Week start date is required');
  }

  if (!input.week_end) {
    throw new Error('Week end date is required');
  }

  if (!input.summary.trim()) {
    throw new Error('Summary is required');
  }

  // Validate dates
  const startDate = new Date(input.week_start);
  const endDate = new Date(input.week_end);

  if (startDate > endDate) {
    throw new Error('Week start date must be before week end date');
  }

  const { data, error } = await supabase
    .from('weekly_reports')
    .insert({
      prefect_id: userId,
      week_start: input.week_start,
      week_end: input.week_end,
      summary: input.summary.trim(),
      achievements: input.achievements?.trim() || null,
      challenges: input.challenges?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create weekly report');
  }

  return data;
};

/**
 * Update a weekly report
 */
export const updateWeeklyReport = async (
  id: string,
  input: UpdateWeeklyReportInput
): Promise<WeeklyReport> => {
  if (input.week_start || input.week_end) {
    // Fetch current report to validate dates
    const currentReport = await fetchWeeklyReportById(id);
    const startDate = new Date(input.week_start || currentReport.week_start);
    const endDate = new Date(input.week_end || currentReport.week_end);

    if (startDate > endDate) {
      throw new Error('Week start date must be before week end date');
    }
  }

  if (input.summary !== undefined && !input.summary.trim()) {
    throw new Error('Summary cannot be empty');
  }

  const updateData: UpdateWeeklyReportInput = {};
  if (input.week_start !== undefined) updateData.week_start = input.week_start;
  if (input.week_end !== undefined) updateData.week_end = input.week_end;
  if (input.summary !== undefined) updateData.summary = input.summary.trim();
  if (input.achievements !== undefined)
    updateData.achievements = input.achievements.trim() || null;
  if (input.challenges !== undefined) updateData.challenges = input.challenges.trim() || null;

  const { data, error } = await supabase
    .from('weekly_reports')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update weekly report');
  }

  return data;
};

/**
 * Delete a weekly report
 */
export const deleteWeeklyReport = async (id: string): Promise<void> => {
  const { error } = await supabase.from('weekly_reports').delete().eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete weekly report');
  }
};

/**
 * Get weekly reports count
 */
export const getWeeklyReportsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('weekly_reports')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch weekly reports count');
  }

  return count || 0;
};

/**
 * Get a prefect's weekly reports count
 */
export const getPrefectWeeklyReportsCount = async (prefectId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('weekly_reports')
    .select('*', { count: 'exact', head: true })
    .eq('prefect_id', prefectId);

  if (error) {
    throw new Error(error.message || 'Failed to fetch weekly reports count');
  }

  return count || 0;
};

/**
 * Search weekly reports by summary, achievements, or challenges
 */
export const searchWeeklyReports = async (searchTerm: string): Promise<WeeklyReport[]> => {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .or(
      `summary.ilike.%${searchTerm}%,achievements.ilike.%${searchTerm}%,challenges.ilike.%${searchTerm}%`
    )
    .order('week_start', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to search weekly reports');
  }

  return data || [];
};
