import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, Edit2, Save, X, CreditCard, TrendingUp, TrendingDown, History } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLoading } from '../contexts/LoadingContext';
import { useNotifier } from '../contexts/NotificationContext';
import { apiRequest } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import DashboardLayout from '../components/layout/DashboardLayout';

interface CreditHistoryItem {
  id: string;
  date: string;
  type: string;
  amount: number;
  templateCategory?: string;
  templateName?: string;
  messageId?: string;
  campaignId?: string;
  description: string;
  timestamp: string;
}

const Profile = () => {
  const { user, refreshUserData } = useAuth();
  const { setLoading } = useLoading();
  const notifier = useNotifier();
  const [isEditing, setIsEditing] = useState(false);
  const [creditHistory, setCreditHistory] = useState<CreditHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  // Fetch credit history
  const fetchCreditHistory = async () => {
    if (!user) return;
    
    try {
      setHistoryLoading(true);
      const response = await apiRequest('/api/credits/history');
      
      if (response.ok) {
        const data = await response.json();
        setCreditHistory(data.history || []);
      } else {
        notifier.error('Failed to load credit history');
      }
    } catch (error) {
      notifier.error('Network error while loading credit history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditHistory();
  }, [user]);

  const handleEditSubmit = async () => {
    if (!user) return;

    try {
      setLoading(true, 'Updating profile...');
      
      const response = await apiRequest('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await refreshUserData();
        setIsEditing(false);
        notifier.success('Profile updated successfully');
      } else {
        notifier.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      notifier.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPhoneNumber = (phone: string | undefined) => {
    if (!phone) return 'Not provided';
    // Format as E.164 if not already
    if (!phone.startsWith('+')) {
      return `+91${phone}`;
    }
    return phone;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your personal information and view your credit history
          </p>
        </motion.div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Personal Info</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>Credit History</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <p className="text-indigo-100">@{user.username}</p>
          <div className="mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
              {user.role === 'admin' ? 'Administrator' : 'User'}
            </span>
          </div>
        </div>

        {/* Profile Information */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Personal Information
            </h3>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleEditSubmit}
                  size="sm"
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Full Name
                </label>
                {isEditing ? (
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {user.name}
                  </p>
                )}
              </div>
            </div>

            {/* Username */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">@</span>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Username
                </label>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email Address
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="mt-1"
                    placeholder="Enter your email address"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {user.email}
                  </p>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phone Number
                </label>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {formatPhoneNumber(user.phoneNumber)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Contact support to change phone number</p>
              </div>
            </div>

            {/* Join Date */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Member Since
                </label>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Account Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Account Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-emerald-50 dark:bg-gray-700 rounded-lg border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {user.creditBalance?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">SMS Credits</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 dark:bg-gray-700 rounded-lg border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {user.role === 'admin' ? 'Admin' : 'Active'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Account Status</div>
            </div>
          </div>
        </motion.div>
      </TabsContent>

      {/* Credit History Tab */}
      <TabsContent value="credits" className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Credit History
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Track all your credit transactions
                </p>
              </div>
            </div>
            <div className="text-right">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {user?.creditBalance?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-500">Current Balance</div>
            </div>
          </div>

          {historyLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="w-20 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : creditHistory.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No credit history available</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {creditHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-emerald-50/50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.type.includes('ADD') 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      {item.type.includes('ADD') ? (
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        {item.templateName && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                            {item.templateName}
                          </span>
                        )}
                        {item.templateCategory && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {item.templateCategory}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {item.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      item.type.includes('ADD') 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {item.amount >= 0 ? '+' : ''}{item.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Credits
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </TabsContent>
    </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;