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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BookOpen, Pencil, Trash2, Eye } from 'lucide-react';
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

interface TrainingMaterialsViewProps {
  materials: Material[];
  categories: Category[];
  onMaterialsChange: (materials: Material[]) => void;
  isAdmin: boolean;
}

export default function TrainingMaterialsView({
  materials,
  categories,
  onMaterialsChange,
  isAdmin,
}: TrainingMaterialsViewProps) {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    is_published: false,
  });

  const filteredMaterials = materials.filter((m) => {
    const matchesCategory = selectedCat === 'all' || m.category_id === selectedCat;
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPublished = isAdmin || m.is_published;
    return matchesCategory && matchesSearch && matchesPublished;
  });

  const getCategoryName = (id: string) => {
    return categories.find((c) => c.id === id)?.name || 'Unknown';
  };

  const handleViewMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setViewDialogOpen(true);
  };

  const handleEditOpen = (material: Material) => {
    setSelectedMaterial(material);
    setEditFormData({
      title: material.title,
      content: material.content || '',
      category_id: material.category_id,
      is_published: material.is_published,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedMaterial) return;

    if (!editFormData.title.trim()) {
      toast.error('Material title is required');
      return;
    }

    setLoading(true);
    try {
      await trainingMaterialsService.updateMaterial(selectedMaterial.id, {
        title: editFormData.title,
        content: editFormData.content,
        category_id: editFormData.category_id,
        is_published: editFormData.is_published,
      });
      toast.success('Material updated successfully');
      setEditDialogOpen(false);
      await fetchMaterials();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update material');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOpen = (material: Material) => {
    setSelectedMaterial(material);
    setDeleteDialogOpen(true);
  };

  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return;

    setLoading(true);
    try {
      await trainingMaterialsService.deleteMaterial(selectedMaterial.id);
      toast.success('Material deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedMaterial(null);
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search">Search Materials</Label>
            <Input
              id="search"
              placeholder="Search by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cat-filter">Filter by Category</Label>
            <Select value={selectedCat} onValueChange={setSelectedCat}>
              <SelectTrigger id="cat-filter" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-2">No training materials found</p>
          <p className="text-xs text-muted-foreground">
            {searchTerm || selectedCat !== 'all' ? 'Try adjusting your filters' : 'Create content to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-3 gap-2">
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {getCategoryName(material.category_id)}
                </Badge>
                {!material.is_published && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Draft
                  </Badge>
                )}
              </div>

              <h3 className="font-display font-semibold mb-2 line-clamp-2">{material.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-grow">
                {material.content || 'No content available'}
              </p>

              <div className="flex gap-2 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleViewMaterial(material)}
                >
                  <Eye size={14} className="mr-1" /> View
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditOpen(material)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteOpen(material)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMaterial?.title}
              {!selectedMaterial?.is_published && (
                <Badge variant="secondary" className="text-xs">
                  Draft
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <p className="text-sm font-medium mt-1">
                  {getCategoryName(selectedMaterial.category_id)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Content</Label>
                <div className="text-sm mt-2 p-4 rounded-lg border border-border bg-muted/30 whitespace-pre-wrap">
                  {selectedMaterial.content || 'No content available'}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">
                  {new Date(selectedMaterial.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2 justify-end pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setViewDialogOpen(false);
                    handleEditOpen(selectedMaterial);
                  }}>
                    <Pencil size={14} className="mr-1" /> Edit
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Training Material</DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Material title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editFormData.category_id} onValueChange={(v) => setEditFormData((p) => ({ ...p, category_id: v }))}>
                  <SelectTrigger id="edit-category">
                    <SelectValue />
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
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  placeholder="Material content"
                  rows={8}
                  value={editFormData.content}
                  onChange={(e) => setEditFormData((p) => ({ ...p, content: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Switch
                  id="edit-published"
                  checked={editFormData.is_published}
                  onCheckedChange={(v) => setEditFormData((p) => ({ ...p, is_published: v }))}
                />
                <Label htmlFor="edit-published" className="cursor-pointer flex-1">
                  Publish
                </Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-full max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMaterial?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMaterial}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
