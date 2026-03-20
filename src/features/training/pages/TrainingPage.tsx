import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Database, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';
import TrainingCategoriesCRUD from '../components/TrainingCategoriesCRUD';
import TrainingMaterialsCRUD from '../components/TrainingMaterialsCRUD';
import TrainingMaterialsView from '../components/TrainingMaterialsView';
import * as trainingCategoriesService from '../services/trainingCategoriesService';
import * as trainingMaterialsService from '../services/trainingMaterialsService';
import { fetchTrainingFromBackend, seedTrainingFromBackend } from '@/features/shared/services/backendAppDataService';

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Material {
  id: string;
  title: string;
  content: string | null;
  is_published: boolean;
  category_id: string;
  created_at: string;
}

export default function TrainingPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'view');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchTrainingFromBackend();
      setCategories(data.categories ?? []);
      setMaterials(data.materials ?? []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeedTrainingData = async () => {
    setSeeding(true);
    try {
      await seedTrainingFromBackend();
      await fetchData();
      toast.success('Training seed data was added and fetched from the database.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed training data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Training & Orientation"
        description="Rules, responsibilities, and training materials"
        actions={
          isAdmin ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleSeedTrainingData}
              disabled={seeding}
              className="gap-2"
            >
              <Database size={16} />
              {seeding ? 'Seeding...' : 'Load Seed Data'}
            </Button>
          ) : null
        }
      />

      {/* Admin Tabs */}
      {isAdmin ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="view" className="gap-2">
              <Eye size={16} /> View
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <Settings size={16} /> Manage
            </TabsTrigger>
          </TabsList>

          {/* View Tab */}
          <TabsContent value="view" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading materials...</p>
              </div>
            ) : (
              <TrainingMaterialsView
                materials={materials}
                categories={categories}
                onMaterialsChange={setMaterials}
                isAdmin={isAdmin}
              />
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
                {/* Categories Section */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <TrainingCategoriesCRUD
                    categories={categories}
                    onCategoriesChange={setCategories}
                  />
                </div>

                {/* Materials Section */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <TrainingMaterialsCRUD
                    categories={categories}
                    onMaterialsChange={setMaterials}
                  />

                  {/* Inline Materials List with Edit/Delete */}
                  <div className="mt-8 pt-8 border-t border-border">
                    <TrainingMaterialsView
                      materials={materials}
                      categories={categories}
                      onMaterialsChange={setMaterials}
                      isAdmin={isAdmin}
                    />
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* Non-Admin View */
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading materials...</p>
            </div>
          ) : (
            <TrainingMaterialsView
              materials={materials}
              categories={categories}
              onMaterialsChange={setMaterials}
              isAdmin={isAdmin}
            />
          )}
        </div>
      )}
    </AppLayout>
  );
}
