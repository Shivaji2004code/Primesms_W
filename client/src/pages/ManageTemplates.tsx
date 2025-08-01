import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Pause,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { 
  Template, 
  TemplatesResponse,
  TemplateStatus,
  TemplateCategory,
  User 
} from '@/types';

interface ManageTemplatesProps {
  currentUser: User;
}

export default function ManageTemplates({ currentUser }: ManageTemplatesProps) {
  // Use currentUser for potential future features like user-specific templates
  console.log('Current user:', currentUser.name);
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [pagination, setPagination] = useState<TemplatesResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'ALL'>('ALL');

  // Dialog states
  const [viewTemplateDialog, setViewTemplateDialog] = useState<{ open: boolean; template: Template | null }>({ 
    open: false, 
    template: null 
  });
  const [deleteTemplateDialog, setDeleteTemplateDialog] = useState<{ open: boolean; template: Template | null }>({ 
    open: false, 
    template: null 
  });

  useEffect(() => {
    fetchTemplates();
  }, [statusFilter, categoryFilter]);

  const fetchTemplates = async (page = 1) => {
    try {
      setIsLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      if (categoryFilter !== 'ALL') {
        params.append('category', categoryFilter);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data: TemplatesResponse = await response.json();
        setTemplates(data.templates);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch templates');
      }

    } catch (error) {
      setError('Network error occurred');
      console.error('Fetch templates error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTemplateDialog.template) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/templates/${deleteTemplateDialog.template.id}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        setDeleteTemplateDialog({ open: false, template: null });
        fetchTemplates(pagination?.currentPage || 1);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete template');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Delete template error:', error);
    }
  };

  const handleSubmitTemplate = async (templateId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/templates/${templateId}/submit`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (response.ok) {
        fetchTemplates(pagination?.currentPage || 1);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit template');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Submit template error:', error);
    }
  };

  const getStatusBadge = (status: TemplateStatus) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary' as const, icon: Edit, label: 'Draft' },
      IN_REVIEW: { variant: 'default' as const, icon: Clock, label: 'In Review' },
      PENDING: { variant: 'default' as const, icon: Clock, label: 'Pending' },
      ACTIVE: { variant: 'default' as const, icon: CheckCircle, label: 'Active' },
      REJECTED: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
      PAUSED: { variant: 'secondary' as const, icon: Pause, label: 'Paused' },
      DISABLED: { variant: 'destructive' as const, icon: Ban, label: 'Disabled' },
      APPEAL_REQUESTED: { variant: 'default' as const, icon: AlertCircle, label: 'Appeal Requested' }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryBadge = (category: TemplateCategory) => {
    const categoryConfig = {
      UTILITY: { variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      MARKETING: { variant: 'secondary' as const, color: 'bg-green-100 text-green-800' },
      AUTHENTICATION: { variant: 'outline' as const, color: 'bg-purple-100 text-purple-800' }
    };

    const config = categoryConfig[category];

    return (
      <Badge variant={config.variant} className={config.color}>
        {category}
      </Badge>
    );
  };

  const renderTemplateComponents = (components: any[]) => {
    return components.map((component, index) => {
      if (component.type === 'BODY') {
        return (
          <div key={index} className="text-sm text-gray-600 truncate max-w-xs">
            {component.text || 'No content'}
          </div>
        );
      }
      return null;
    }).filter(Boolean);
  };

  const filteredTemplates = templates.filter(template =>
    searchTerm === '' || 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Templates</h1>
          <p className="text-gray-600">Create and manage your WhatsApp message templates</p>
        </div>
        <Button onClick={() => navigate('/user/templates/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: TemplateStatus | 'ALL') => setStatusFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(value: TemplateCategory | 'ALL') => setCategoryFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => fetchTemplates(pagination?.currentPage || 1)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates ({pagination?.totalTemplates || 0})</CardTitle>
          <CardDescription>
            Manage your WhatsApp message templates and their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Content Preview</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No templates found. Create your first template to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{getCategoryBadge(template.category)}</TableCell>
                    <TableCell>{getStatusBadge(template.status)}</TableCell>
                    <TableCell>{template.language}</TableCell>
                    <TableCell>{renderTemplateComponents(template.components)}</TableCell>
                    <TableCell>
                      {template.qualityRating ? (
                        <Badge variant={template.qualityRating === 'HIGH' ? 'default' : 'secondary'}>
                          {template.qualityRating}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(template.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewTemplateDialog({ open: true, template })}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {['DRAFT', 'REJECTED'].includes(template.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/user/templates/${template.id}/edit`)}
                            title="Edit Template"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}

                        {['DRAFT', 'REJECTED'].includes(template.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmitTemplate(template.id)}
                            title="Submit to WhatsApp"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTemplateDialog({ open: true, template })}
                          title="Delete Template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalTemplates)} of {pagination.totalTemplates} templates
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTemplates(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTemplates(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Template Dialog */}
      <Dialog open={viewTemplateDialog.open} onOpenChange={(open) => setViewTemplateDialog({ open, template: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Details</DialogTitle>
            <DialogDescription>
              {viewTemplateDialog.template?.name}
            </DialogDescription>
          </DialogHeader>
          {viewTemplateDialog.template && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{viewTemplateDialog.template.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900">{viewTemplateDialog.template.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{getStatusBadge(viewTemplateDialog.template.status)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Language</label>
                  <p className="text-sm text-gray-900">{viewTemplateDialog.template.language}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Components</label>
                <div className="mt-2 space-y-2">
                  {viewTemplateDialog.template.components.map((component, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <div className="font-medium text-xs text-gray-500 uppercase">{component.type}</div>
                      {component.text && (
                        <div className="mt-1 text-sm">{component.text}</div>
                      )}
                      {component.buttons && (
                        <div className="mt-2">
                          {component.buttons.map((button, btnIndex) => (
                            <Badge key={btnIndex} variant="outline" className="mr-2">
                              {button.type}: {button.text}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {viewTemplateDialog.template.rejectionReason && (
                <div>
                  <label className="text-sm font-medium text-red-700">Rejection Reason</label>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {viewTemplateDialog.template.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTemplateDialog({ open: false, template: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={deleteTemplateDialog.open} onOpenChange={(open) => setDeleteTemplateDialog({ open, template: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTemplateDialog.template?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTemplateDialog({ open: false, template: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}