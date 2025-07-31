import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  CreditCard, 
  Eye, 
  Settings, 
  Trash2, 
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import AdminLayout from '@/components/AdminLayout';
import type { User } from '@/types';

interface AdminStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  totalCredits: number;
  newUsersToday: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UserWithStatus extends User {
  hasBusinessInfo?: boolean;
}

interface UsersResponse {
  users: UserWithStatus[];
  pagination: PaginationInfo;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Dialog states
  const [viewUserDialog, setViewUserDialog] = useState<{ open: boolean; user: UserWithStatus | null }>({ open: false, user: null });
  const [deleteUserDialog, setDeleteUserDialog] = useState<{ open: boolean; user: UserWithStatus | null }>({ open: false, user: null });
  const [createUserDialog, setCreateUserDialog] = useState(false);
  
  // Form states
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    phoneNumber: '',
    role: 'user' as 'user' | 'admin',
    creditBalance: 1000
  });

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
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async (page = 1) => {
    try {
      setIsLoading(true);
      
      const [usersResponse, statsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?page=${page}&limit=10`, {
          credentials: 'include'
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats`, {
          credentials: 'include'
        })
      ]);

      if (usersResponse.ok) {
        const usersData: UsersResponse = await usersResponse.json();
        
        // Check business info status for each user
        const usersWithStatus = await Promise.all(
          usersData.users.map(async (user) => {
            try {
              const businessResponse = await fetch(
                `${import.meta.env.VITE_API_URL}/api/admin/users/${user.id}/business-info`,
                { credentials: 'include' }
              );
              if (businessResponse.ok) {
                const businessData = await businessResponse.json();
                return {
                  ...user,
                  hasBusinessInfo: businessData.businessInfo !== null
                };
              }
            } catch (error) {
              console.error('Error checking business info for user:', user.id);
            }
            return { ...user, hasBusinessInfo: false };
          })
        );
        
        setUsers(usersWithStatus);
        setPagination(usersData.pagination);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

    } catch (error) {
      setError('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteUser = async () => {
    if (!deleteUserDialog.user) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${deleteUserDialog.user.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setDeleteUserDialog({ open: false, user: null });
        fetchDashboardData(pagination?.currentPage || 1);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };


  const handleCreateUser = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(createFormData)
      });

      if (response.ok) {
        setCreateUserDialog(false);
        setCreateFormData({
          name: '',
          email: '',
          username: '',
          password: '',
          phoneNumber: '',
          role: 'user',
          creditBalance: 1000
        });
        fetchDashboardData(pagination?.currentPage || 1);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create user');
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const handleUserDetails = (userId: string) => {
    navigate(`/admin/users/${userId}/details`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentUser={currentUser}>
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

        {/* Enhanced Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats.newUsersToday} new today
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Admin Users</CardTitle>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.adminUsers}</div>
                <p className="text-xs text-gray-500">
                  Administrative accounts
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Regular Users</CardTitle>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.regularUsers}</div>
                <p className="text-xs text-gray-500">
                  Standard user accounts
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Credits</CardTitle>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalCredits.toLocaleString()}</div>
                <p className="text-xs text-gray-500">
                  Across all accounts
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>
                  Manage all user accounts and their permissions
                </CardDescription>
              </div>
              <Button onClick={() => setCreateUserDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>WhatsApp Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.phoneNumber || '-'}</TableCell>
                    <TableCell>{user.creditBalance.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {user.hasBusinessInfo ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">Configured</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <XCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Not configured</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewUserDialog({ open: true, user })}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserDetails(user.id)}
                          title="Edit User"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteUserDialog({ open: true, user })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalUsers)} of {pagination.totalUsers} users
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDashboardData(pagination.currentPage - 1)}
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
                    onClick={() => fetchDashboardData(pagination.currentPage + 1)}
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
      </div>

      {/* View User Dialog */}
      <Dialog open={viewUserDialog.open} onOpenChange={(open) => setViewUserDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewUserDialog.user?.name}
            </DialogDescription>
          </DialogHeader>
          {viewUserDialog.user && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{viewUserDialog.user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{viewUserDialog.user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Username</label>
                <p className="text-sm text-gray-900">{viewUserDialog.user.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <p className="text-sm text-gray-900">{viewUserDialog.user.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <p className="text-sm text-gray-900 capitalize">{viewUserDialog.user.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Credit Balance</label>
                <p className="text-sm text-gray-900">{viewUserDialog.user.creditBalance.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Created At</label>
                <p className="text-sm text-gray-900">{formatDate(viewUserDialog.user.createdAt)}</p>
              </div>
              {viewUserDialog.user.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900">{formatDate(viewUserDialog.user.updatedAt)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUserDialog({ open: false, user: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Create User Dialog */}
      <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name *</label>
              <Input
                value={createFormData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateFormData({ ...createFormData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email *</label>
              <Input
                type="email"
                value={createFormData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateFormData({ ...createFormData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Username *</label>
              <Input
                value={createFormData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateFormData({ ...createFormData, username: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Password *</label>
              <Input
                type="password"
                value={createFormData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateFormData({ ...createFormData, password: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <Input
                value={createFormData.phoneNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateFormData({ ...createFormData, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={createFormData.role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateFormData({ ...createFormData, role: e.target.value as 'user' | 'admin' })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Initial Credit Balance</label>
              <Input
                type="number"
                value={createFormData.creditBalance}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateFormData({ ...createFormData, creditBalance: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteUserDialog.open} onOpenChange={(open) => setDeleteUserDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteUserDialog.user?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}