import { supabase } from '@/integrations/supabase/client';

interface GateAssistanceLog {
  id: string;
  prefect_id: string;
  log_date: string;
  time_in: string;
  time_out: string | null;
  notes: string | null;
  created_at: string;
}

interface CreateGateLogInput {
  prefect_id: string;
  log_date: string;
  time_in: string;
  time_out?: string;
  notes?: string;
}

interface UpdateGateLogInput {
  log_date?: string;
  time_in?: string;
  time_out?: string;
  notes?: string;
}

/**
 * Fetch all gate assistance logs
 */
export const fetchGateLogs = async (): Promise<GateAssistanceLog[]> => {
  const { data, error } = await supabase
    .from('gate_assistance_logs')
    .select('*')
    .order('log_date', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch gate logs');
  }

  return data || [];
};

/**
 * Fetch prefect's own gate logs
 */
export const fetchUserGateLogs = async (userId: string): Promise<GateAssistanceLog[]> => {
  const { data, error } = await supabase
    .from('gate_assistance_logs')
    .select('*')
    .eq('prefect_id', userId)
    .order('log_date', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch gate logs');
  }

  return data || [];
};

/**
 * Fetch a single gate log by ID
 */
export const fetchGateLogById = async (id: string): Promise<GateAssistanceLog> => {
  const { data, error } = await supabase
    .from('gate_assistance_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to fetch gate log');
  }

  return data;
};

/**
 * Fetch gate logs for a specific date range
 */
export const fetchGateLogsByDateRange = async (startDate: string, endDate: string): Promise<GateAssistanceLog[]> => {
  const { data, error } = await supabase
    .from('gate_assistance_logs')
    .select('*')
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch gate logs');
  }

  return data || [];
};

/**
 * Create a new gate assistance log
 */
export const createGateLog = async (input: CreateGateLogInput): Promise<GateAssistanceLog> => {
  if (!input.prefect_id) {
    throw new Error('Prefect is required');
  }

  if (!input.log_date) {
    throw new Error('Log date is required');
  }

  if (!input.time_in) {
    throw new Error('Time in is required');
  }

  const { data, error } = await supabase
    .from('gate_assistance_logs')
    .insert({
      prefect_id: input.prefect_id,
      log_date: input.log_date,
      time_in: input.time_in,
      time_out: input.time_out || null,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create gate log');
  }

  return data;
};

/**
 * Update a gate log
 */
export const updateGateLog = async (id: string, input: UpdateGateLogInput): Promise<GateAssistanceLog> => {
  const updateData: UpdateGateLogInput = {};
  if (input.log_date !== undefined) updateData.log_date = input.log_date;
  if (input.time_in !== undefined) updateData.time_in = input.time_in;
  if (input.time_out !== undefined) updateData.time_out = input.time_out || null;
  if (input.notes !== undefined) updateData.notes = input.notes.trim() || null;

  const { data, error } = await supabase
    .from('gate_assistance_logs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update gate log');
  }

  return data;
};

/**
 * Delete a gate log
 */
export const deleteGateLog = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('gate_assistance_logs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete gate log');
  }
};

/**
 * Get gate logs count by prefect
 */
export const getGateLogsStats = async (): Promise<{ total: number; today: number }> => {
  const now = new Date().toISOString().split('T')[0];

  const [totalResult, todayResult] = await Promise.all([
    supabase.from('gate_assistance_logs').select('*', { count: 'exact', head: true }),
    supabase
      .from('gate_assistance_logs')
      .select('*', { count: 'exact', head: true })
      .eq('log_date', now),
  ]);

  return {
    total: totalResult.count || 0,
    today: todayResult.count || 0,
  };
};

/**
 * Search gate logs by prefect name or notes
 */
export const searchGateLogs = async (searchTerm: string): Promise<GateAssistanceLog[]> => {
  const { data, error } = await supabase
    .from('gate_assistance_logs')
    .select('*')
    .or(`notes.ilike.%${searchTerm}%`)
    .order('log_date', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to search gate logs');
  }

  return data || [];
};

/**
 * Fetch all prefect profiles for assignment
 */
export const fetchPrefects = async (): Promise<Array<{ id: string; first_name: string; last_name: string }>> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .order('first_name');

  if (error) {
    throw new Error(error.message || 'Failed to fetch prefects');
  }

  return data || [];
};
