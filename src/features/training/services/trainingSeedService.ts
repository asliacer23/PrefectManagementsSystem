import { supabase } from '@/integrations/supabase/client';

const seededCategories = [
  {
    id: '70000000-0000-4000-8000-000000000001',
    name: 'Policies',
    description: 'School rules, discipline code, and prefect procedures',
  },
  {
    id: '70000000-0000-4000-8000-000000000002',
    name: 'Operations',
    description: 'Duty workflow and reporting operations',
  },
  {
    id: '70000000-0000-4000-8000-000000000003',
    name: 'Leadership',
    description: 'Communication, coordination, and decision-making guides for prefects',
  },
];

const buildSeededMaterials = (createdBy: string) => [
  {
    id: '71000000-0000-4000-8000-000000000001',
    category_id: '70000000-0000-4000-8000-000000000001',
    title: 'Prefect Code of Conduct',
    content:
      'Maintain professionalism, accurate reporting, and respectful intervention in all student-facing duties.',
    created_by: createdBy,
    is_published: true,
  },
  {
    id: '71000000-0000-4000-8000-000000000002',
    category_id: '70000000-0000-4000-8000-000000000002',
    title: 'Daily Duty Handover Guide',
    content:
      'Review the assigned post, confirm attendance, log notable activity, and submit reports before end of shift.',
    created_by: createdBy,
    is_published: true,
  },
  {
    id: '71000000-0000-4000-8000-000000000003',
    category_id: '70000000-0000-4000-8000-000000000003',
    title: 'Conflict De-escalation Basics',
    content:
      'Use calm verbal redirection, keep a safe distance, document witnesses, and escalate to faculty when necessary.',
    created_by: createdBy,
    is_published: true,
  },
  {
    id: '71000000-0000-4000-8000-000000000004',
    category_id: '70000000-0000-4000-8000-000000000002',
    title: 'Incident Report Writing Template',
    content:
      'Record time, location, involved parties, sequence of events, intervention taken, and follow-up recommendations.',
    created_by: createdBy,
    is_published: false,
  },
];

export async function seedTrainingData(): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { error: categoryError } = await supabase
    .from('training_categories')
    .upsert(seededCategories, { onConflict: 'id' });

  if (categoryError) {
    throw new Error(categoryError.message || 'Failed to seed training categories');
  }

  const { error: materialError } = await supabase
    .from('training_materials')
    .upsert(buildSeededMaterials(user.id), { onConflict: 'id' });

  if (materialError) {
    throw new Error(materialError.message || 'Failed to seed training materials');
  }
}
