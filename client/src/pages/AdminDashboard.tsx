import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Eye, 
  Trash2, 
  Plus,
  CheckCircle,
  XCircle,
  Settings,
  Wallet,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import type { User } from '../types';
import DashboardLayout from '../components/layout/DashboardLayout';

interface UserWithStatus extends User {
  hasBusinessInfo?: boolean;
}

interface AdminStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  totalCredits: number;
  newUsersToday: number;
}

interface ApiResponse<T> {
  users?: T[];
  stats?: AdminStats;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
  message?: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithStatus | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    phoneNumber: '',
    role: 'user',
    creditBalance: 1000
  });

  // Fetch data from API
  useEffect(() => {
    fetchUsersAndStats();
  }, []);

  const fetchUsersAndStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users and stats in parallel
      const [usersResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/users', {
          credentials: 'include'
        }),
        fetch('/api/admin/stats', {
          credentials: 'include'
        })
      ]);

      if (!usersResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const usersData: ApiResponse<User> = await usersResponse.json();
      const statsData: ApiResponse<any> = await statsResponse.json();

      if (usersData.error) {
        throw new Error(usersData.error);
      }

      if (statsData.error) {
        throw new Error(statsData.error);
      }

      // Check which users have business info
      const usersWithBusinessInfo = await Promise.all(
        (usersData.users || []).map(async (user) => {
          try {
            const businessResponse = await fetch(`/api/admin/users/${user.id}/business-info`, {
              credentials: 'include'
            });
            
            if (businessResponse.ok) {
              const businessData = await businessResponse.json();
              return {
                ...user,
                hasBusinessInfo: !!businessData.businessInfo
              };
            }
            
            return {
              ...user,
              hasBusinessInfo: false
            };
          } catch {
            return {
              ...user,
              hasBusinessInfo: false
            };
          }
        })
      );

      setUsers(usersWithBusinessInfo);
      setStats(statsData.stats || null);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        setShowDeleteDialog(false);
        setSelectedUser(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const result = await response.json();
        setUsers([...users, { ...result.user, hasBusinessInfo: false }]);
        setShowAddUserDialog(false);
        setNewUser({
          name: '',
          email: '',
          username: '',
          password: '',
          phoneNumber: '',
          role: 'user',
          creditBalance: 1000
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout 
        title="Admin Dashboard"
        subtitle="Manage users and system settings."
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout 
        title="Admin Dashboard"
        subtitle="Manage users and system settings."
      >
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error loading dashboard</span>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
            <Button 
              onClick={fetchUsersAndStats} 
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Admin Dashboard"
      subtitle="Manage users and system settings."
    >
      {/* Action Buttons */}
      <div className="flex justify-end mb-8">
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button 
            onClick={() => setShowAddUserDialog(true)} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalUsers || users.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Regular Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.regularUsers || users.filter(u => u.role === 'user').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Configured Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.filter(u => u.hasBusinessInfo).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalCredits?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Username</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Credits</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {user.username}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className={user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700 border-purple-200' 
                          : 'bg-green-100 text-green-700 border-green-200'
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900">
                        {user.creditBalance?.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.hasBusinessInfo ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not configured
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/users/${user.id}/details`)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/users/${user.id}/settings`)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="User Settings"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/users/${user.id}/wallet`)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Manage Wallet"
                        >
                          <Wallet className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/users/${user.id}/templates`)}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          title="Manage Templates"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with the specified details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="Email Address"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                placeholder="Phone Number"
                value={newUser.phoneNumber}
                onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="creditBalance">Initial Credit Balance</Label>
              <Input
                id="creditBalance"
                placeholder="1000"
                type="number"
                value={newUser.creditBalance}
                onChange={(e) => setNewUser({ ...newUser, creditBalance: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreateUser}
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}