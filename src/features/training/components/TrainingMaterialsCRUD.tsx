import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import * as trainingMaterialsService from '../services/trainingMaterialsService';

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

interface TrainingMaterialsCRUDProps {
  categories: Category[];
  onMaterialsChange: (materials: Material[]) => void;
}

export default function TrainingMaterialsCRUD({ categories, onMaterialsChange }: TrainingMaterialsCRUDProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    is_published: false,
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', category_id: '', is_published: false });
    setEditingId(null);
  };

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setFormData({
        title: material.title,
        content: material.content || '',
        category_id: material.category_id,
        is_published: material.is_published,
      });
      setEditingId(material.id);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSaveMaterial = async () => {
    if (!formData.title.trim()) {
      toast.error('Material title is required');
      return;
    }

    if (!formData.category_id) {
      toast.error('Please select a category');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await trainingMaterialsService.updateMaterial(editingId, {
          title: formData.title,
          content: formData.content,
          category_id: formData.category_id,
          is_published: formData.is_published,
        });
        toast.success('Material updated successfully');
      } else {
        await trainingMaterialsService.createMaterial({
          title: formData.title,
          content: formData.content,
          category_id: formData.category_id,
          is_published: formData.is_published,
        });
        toast.success('Material created successfully');
      }

      setDialogOpen(false);
      resetForm();
      await fetchMaterials();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save material');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return;

    setLoading(true);
    try {
      await trainingMaterialsService.deleteMaterial(materialToDelete.id);
      toast.success('Material deleted successfully');
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
      await fetchMaterials();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete material');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const data = await trainingMaterialsService.fetchMaterials();
      onMaterialsChange(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch materials');
    }
  };

  const getCategoryName = (id: string) => {
    return categories.find((c) => c.id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Training Materials</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus size={16} className="mr-1" /> New Material
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Material' : 'New Training Material'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mat-title">Title</Label>
                <Input
                  id="mat-title"
                  placeholder="Material title"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="mat-category">Category</Label>
                <Select value={formData.category_id} onValueChange={(v) => setFormData((p) => ({ ...p, category_id: v }))}>
                  <SelectTrigger id="mat-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mat-content">Content</Label>
                <Textarea
                  id="mat-content"
                  placeholder="Material content"
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Switch
                  id="mat-published"
                  checked={formData.is_published}
                  onCheckedChange={(v) => setFormData((p) => ({ ...p, is_published: v }))}
                />
                <Label htmlFor="mat-published" className="cursor-pointer flex-1">
                  Publish immediately
                </Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveMaterial} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Material'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Use the "New Material" button above to manage training materials directly from the main view.</p>
      </div>
    </div>
  );
}
