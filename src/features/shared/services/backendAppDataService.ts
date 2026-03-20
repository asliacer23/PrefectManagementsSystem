const APP_DATA_BASE_URL = import.meta.env.DEV ? '/api/app-data' : '/.netlify/functions/app-data';

async function request(resource: string, mode: 'fetch' | 'seed' = 'fetch') {
  const response = await fetch(`${APP_DATA_BASE_URL}?resource=${encodeURIComponent(resource)}&mode=${mode}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const payload = await response.json();

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || `Failed to ${mode} ${resource}`);
  }

  return payload.data;
}

async function mutateTraining(action: string, payload: Record<string, unknown>) {
  const response = await fetch(`${APP_DATA_BASE_URL}?resource=training`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  const result = await response.json();

  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || `Failed to ${action}`);
  }

  return result.data;
}

export const fetchComplaintsFromBackend = () => request('complaints');
export const seedComplaintsFromBackend = () => request('complaints', 'seed');

export const fetchIncidentsFromBackend = () => request('incidents');
export const seedIncidentsFromBackend = () => request('incidents', 'seed');

export const fetchDutiesFromBackend = () => request('duties');
export const seedDutiesFromBackend = () => request('duties', 'seed');

export const fetchEventsFromBackend = () => request('events');
export const seedEventsFromBackend = () => request('events', 'seed');

export const fetchTrainingFromBackend = () => request('training');
export const seedTrainingFromBackend = () => request('training', 'seed');
export const createTrainingCategoryFromBackend = (payload: { name: string; description?: string }) =>
  mutateTraining('create-category', payload);
export const updateTrainingCategoryFromBackend = (payload: { id: string; name: string; description?: string }) =>
  mutateTraining('update-category', payload);
export const deleteTrainingCategoryFromBackend = (id: string) =>
  mutateTraining('delete-category', { id });
export const createTrainingMaterialFromBackend = (payload: {
  title: string;
  content?: string;
  category_id: string;
  is_published?: boolean;
}) => mutateTraining('create-material', payload);
export const updateTrainingMaterialFromBackend = (payload: {
  id: string;
  title: string;
  content?: string;
  category_id: string;
  is_published?: boolean;
}) => mutateTraining('update-material', payload);
export const deleteTrainingMaterialFromBackend = (id: string) =>
  mutateTraining('delete-material', { id });

export const fetchGateLogsFromBackend = () => request('gate-logs');
export const seedGateLogsFromBackend = () => request('gate-logs', 'seed');

export const fetchAttendanceFromBackend = () => request('attendance');
export const seedAttendanceFromBackend = () => request('attendance', 'seed');

export const fetchEvaluationsFromBackend = () => request('evaluations');
export const seedEvaluationsFromBackend = () => request('evaluations', 'seed');

export const fetchRecruitmentFromBackend = () => request('recruitment');
export const seedRecruitmentFromBackend = () => request('recruitment', 'seed');

export const fetchWeeklyReportsFromBackend = () => request('weekly-reports');
export const seedWeeklyReportsFromBackend = () => request('weekly-reports', 'seed');
