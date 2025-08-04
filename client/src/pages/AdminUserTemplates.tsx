import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  FileText,
  MessageSquare,
  Image,
  Link,
  Phone
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '../components/ui/dialog';
import DashboardLayout from '../components/layout/DashboardLayout';
import type { Template, User } from '../types';

interface TemplateWithDetails extends Template {
  // Template already has components: TemplateComponent[], so we don't need to redefine it
}

interface AdminTemplateStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminUserTemplates() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<TemplateWithDetails[]>([]);
  const [stats, setStats] = useState<AdminTemplateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithDetails | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    fetchUserAndTemplates();
  }, [id]);

  const fetchUserAndTemplates = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError('');

      // Fetch user details and templates in parallel
      const [userResponse, templatesResponse] = await Promise.all([
        fetch(`/api/admin/users/${id}/details`, { credentials: 'include' }),
        fetch(`/api/admin/users/${id}/templates`, { credentials: 'include' })
      ]);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
        setStats(templatesData.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load user templates');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplateStatus = async () => {
    if (!selectedTemplate) return;

    try {
      setIsUpdating(true);
      setError('');

      const response = await fetch(`/api/admin/templates/${selectedTemplate.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSuccessMessage(`Template ${newStatus.toLowerCase()} successfully`);
        setShowStatusDialog(false);
        setSelectedTemplate(null);
        await fetchUserAndTemplates(); // Refresh data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update template status');
      }
    } catch (error) {
      console.error('Error updating template status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update template status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toUpperCase()) {
      case 'MARKETING':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'UTILITY':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'AUTHENTICATION':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const renderTemplatePreview = () => {
    if (!selectedTemplate?.components) return null;

    return (
      <div className="space-y-4">
        {selectedTemplate.components.map((component, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{component.type}</Badge>
              {component.format && (
                <Badge variant="secondary">{component.format}</Badge>
              )}
            </div>
            
            {component.type === 'HEADER' && (
              <div className="bg-gray-50 p-3 rounded">
                {component.format === 'TEXT' ? (
                  <p className="font-semibold">{component.text || 'Header Text'}</p>
                ) : component.format === 'IMAGE' ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Image className="h-4 w-4" />
                    <span>Image Header</span>
                  </div>
                ) : null}
              </div>
            )}

            {component.type === 'BODY' && (
              <div className="bg-blue-50 p-3 rounded">
                <p>{component.text || 'Body text'}</p>
              </div>
            )}

            {component.type === 'FOOTER' && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">{component.text || 'Footer text'}</p>
              </div>
            )}

            {component.type === 'BUTTONS' && component.buttons && (
              <div className="space-y-2">
                {component.buttons.map((button, btnIndex) => (
                  <div key={btnIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    {button.type === 'URL' && <Link className="h-4 w-4" />}
                    {button.type === 'PHONE_NUMBER' && <Phone className="h-4 w-4" />}
                    {button.type === 'QUICK_REPLY' && <MessageSquare className="h-4 w-4" />}
                    <span className="text-sm">{button.text}</span>
                    <Badge variant="outline" className="text-xs">{button.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Loading user templates">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={`${user?.name || 'User'} Templates`} 
      subtitle={`Manage templates for ${user?.username || 'user'}`}
    >
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Templates</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Templates</CardTitle>
            <CardDescription>
              Manage and approve templates created by {user?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500">This user hasn't created any templates yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(template.category)}
                            <span className="font-medium">{template.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.category}</Badge>
                        </TableCell>
                        <TableCell>{template.language}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(template.status)}>
                            {getStatusIcon(template.status)}
                            <span className="ml-1">{template.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {new Date(template.createdAt || '').toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setShowPreviewDialog(true);
                              }}
                              title="Preview Template"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {template.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTemplate(template);
                                    setNewStatus('APPROVED');
                                    setShowStatusDialog(true);
                                  }}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Approve Template"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTemplate(template);
                                    setNewStatus('REJECTED');
                                    setShowStatusDialog(true);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Reject Template"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
              <DialogDescription>
                Preview of the template structure and content
              </DialogDescription>
            </DialogHeader>
            {renderTemplatePreview()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {newStatus === 'APPROVED' ? 'Approve' : 'Reject'} Template
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {newStatus.toLowerCase()} the template "{selectedTemplate?.name}"?
                {newStatus === 'APPROVED' && (
                  <span className="block mt-2 text-green-600">
                    This will make the template available for the user to send messages.
                  </span>
                )}
                {newStatus === 'REJECTED' && (
                  <span className="block mt-2 text-red-600">
                    This will prevent the user from using this template.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowStatusDialog(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                onClick={updateTemplateStatus}
                disabled={isUpdating}
                className={newStatus === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {isUpdating ? 'Updating...' : `${newStatus === 'APPROVED' ? 'Approve' : 'Reject'} Template`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}