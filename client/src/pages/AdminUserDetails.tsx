import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/AdminLayout';
import type { User, UserWithBusinessInfo, CreateBusinessInfoRequest } from '@/types';

export default function AdminUserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserWithBusinessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showAccessToken, setShowAccessToken] = useState(false);

  // Form states
  const [basicFormData, setBasicFormData] = useState({
    name: '',
    email: '',
    username: '',
    phoneNumber: '',
    role: 'user' as 'user' | 'admin',
    creditBalance: 0
  });

  const [businessFormData, setBusinessFormData] = useState<CreateBusinessInfoRequest>({
    businessName: '',
    whatsappNumber: '',
    whatsappNumberId: '',
    wabaId: '',
    accessToken: '',
    webhookUrl: '',
    webhookVerifyToken: '',
    isActive: true
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Check if user is logged in and is admin
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const user: User = JSON.parse(userData);
    if (user.role !== 'admin') {
      navigate('/user/dashboard');
      return;
    }

    setCurrentUser(user);
    fetchUserDetails();
  }, [navigate, id]);

  const fetchUserDetails = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${id}/details`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(data.user);
        
        // Populate form data
        setBasicFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          username: data.user.username || '',
          phoneNumber: data.user.phoneNumber || '',
          role: data.user.role || 'user',
          creditBalance: data.user.creditBalance || 0
        });

        if (data.user.businessInfo) {
          setBusinessFormData({
            businessName: data.user.businessInfo.businessName || '',
            whatsappNumber: data.user.businessInfo.whatsappNumber || '',
            whatsappNumberId: data.user.businessInfo.whatsappNumberId || '',
            wabaId: data.user.businessInfo.wabaId || '',
            accessToken: data.user.businessInfo.accessToken || '',
            webhookUrl: data.user.businessInfo.webhookUrl || '',
            webhookVerifyToken: data.user.businessInfo.webhookVerifyToken || '',
            isActive: data.user.businessInfo.isActive ?? true
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch user details');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Basic info validation
    if (!basicFormData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!basicFormData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(basicFormData.email)) {
        errors.email = 'Invalid email format';
      }
    }

    if (!basicFormData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (basicFormData.creditBalance < 0) {
      errors.creditBalance = 'Credit balance cannot be negative';
    }

    // Business info validation
    if (businessFormData.whatsappNumber && !/^\+?[\d\s-()]+$/.test(businessFormData.whatsappNumber)) {
      errors.whatsappNumber = 'Invalid WhatsApp number format';
    }

    if (businessFormData.webhookUrl && !/^https?:\/\/.+/.test(businessFormData.webhookUrl)) {
      errors.webhookUrl = 'Webhook URL must be a valid HTTP/HTTPS URL';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !id) return;

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Update basic user info
      const basicResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(basicFormData)
      });

      if (!basicResponse.ok) {
        const errorData = await basicResponse.json();
        throw new Error(errorData.error || 'Failed to update basic information');
      }

      // Update business info
      const businessResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${id}/business-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(businessFormData)
      });

      if (!businessResponse.ok) {
        const errorData = await businessResponse.json();
        throw new Error(errorData.error || 'Failed to update business information');
      }

      setSuccessMessage('User details updated successfully');
      fetchUserDetails(); // Refresh data

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update user details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any, isBusinessField = false) => {
    if (isBusinessField) {
      setBusinessFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setBasicFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear field error
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear messages
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  if (!currentUser) {
    return null;
  }

  if (isLoading) {
    return (
      <AdminLayout currentUser={currentUser}>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentUser={currentUser}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600">
                {userDetails ? `Editing ${userDetails.name}` : 'Edit user information'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/dashboard')}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}

        {/* Form */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                User account details and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name *</label>
                <Input
                  value={basicFormData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={formErrors.name ? 'border-red-300' : ''}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Email *</label>
                <Input
                  type="email"
                  value={basicFormData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={formErrors.email ? 'border-red-300' : ''}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Username *</label>
                <Input
                  value={basicFormData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={formErrors.username ? 'border-red-300' : ''}
                />
                {formErrors.username && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.username}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <Input
                  value={basicFormData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={basicFormData.role}
                  onChange={(e) => handleInputChange('role', e.target.value as 'user' | 'admin')}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Credit Balance</label>
                <Input
                  type="number"
                  value={basicFormData.creditBalance}
                  onChange={(e) => handleInputChange('creditBalance', parseInt(e.target.value) || 0)}
                  className={formErrors.creditBalance ? 'border-red-300' : ''}
                />
                {formErrors.creditBalance && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.creditBalance}</p>
                )}
              </div>

              {userDetails && (
                <div className="pt-4 border-t text-sm text-gray-600">
                  <p><strong>User ID:</strong> {userDetails.id}</p>
                  <p><strong>Created:</strong> {new Date(userDetails.createdAt).toLocaleDateString()}</p>
                  {userDetails.updatedAt && (
                    <p><strong>Updated:</strong> {new Date(userDetails.updatedAt).toLocaleDateString()}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business Information</CardTitle>
              <CardDescription>
                WhatsApp Business API credentials and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Business Name</label>
                <Input
                  value={businessFormData.businessName || ''}
                  onChange={(e) => handleInputChange('businessName', e.target.value, true)}
                  placeholder="Your Business Name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
                <Input
                  value={businessFormData.whatsappNumber || ''}
                  onChange={(e) => handleInputChange('whatsappNumber', e.target.value, true)}
                  placeholder="+1234567890"
                  className={formErrors.whatsappNumber ? 'border-red-300' : ''}
                />
                {formErrors.whatsappNumber && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.whatsappNumber}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">WhatsApp Number ID</label>
                <Input
                  value={businessFormData.whatsappNumberId || ''}
                  onChange={(e) => handleInputChange('whatsappNumberId', e.target.value, true)}
                  placeholder="Meta WhatsApp Number ID"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">WABA ID</label>
                <Input
                  value={businessFormData.wabaId || ''}
                  onChange={(e) => handleInputChange('wabaId', e.target.value, true)}
                  placeholder="WhatsApp Business Account ID"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Access Token</label>
                <div className="relative">
                  <Input
                    type={showAccessToken ? 'text' : 'password'}
                    value={businessFormData.accessToken || ''}
                    onChange={(e) => handleInputChange('accessToken', e.target.value, true)}
                    placeholder="Meta API Access Token"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessToken(!showAccessToken)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Webhook URL</label>
                <Input
                  value={businessFormData.webhookUrl || ''}
                  onChange={(e) => handleInputChange('webhookUrl', e.target.value, true)}
                  placeholder="https://your-domain.com/webhook"
                  className={formErrors.webhookUrl ? 'border-red-300' : ''}
                />
                {formErrors.webhookUrl && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.webhookUrl}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Webhook Verify Token</label>
                <Input
                  value={businessFormData.webhookVerifyToken || ''}
                  onChange={(e) => handleInputChange('webhookVerifyToken', e.target.value, true)}
                  placeholder="Your webhook verification token"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={businessFormData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked, true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Account Active
                </label>
              </div>

              {userDetails?.businessInfo && (
                <div className="pt-4 border-t text-sm text-gray-600">
                  <p><strong>Business ID:</strong> {userDetails.businessInfo.id}</p>
                  <p><strong>Created:</strong> {new Date(userDetails.businessInfo.createdAt).toLocaleDateString()}</p>
                  <p><strong>Updated:</strong> {new Date(userDetails.businessInfo.updatedAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}