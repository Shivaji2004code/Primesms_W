import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Minus, Plus, Save, X, DollarSign, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardLayout from '../components/layout/DashboardLayout';
import type { UserWithBusinessInfo } from '@/types';

export default function AdminUserWallet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [userDetails, setUserDetails] = useState<UserWithBusinessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [operationType, setOperationType] = useState<'add' | 'deduct'>('deduct');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${id}/details`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(data.user);
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

  const handleCreditUpdate = async () => {
    if (!id || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this credit adjustment');
      return;
    }

    setIsUpdating(true);
    setError('');
    setSuccessMessage('');

    try {
      // Ensure proper number conversion and decimal precision
      const currentBalance = parseFloat(userDetails?.creditBalance?.toString() || '0');
      const amountToProcess = parseFloat(amount.toString());
      let newBalance;
      
      if (operationType === 'add') {
        newBalance = Math.round((currentBalance + amountToProcess) * 100) / 100;
      } else {
        newBalance = Math.round(Math.max(0, currentBalance - amountToProcess) * 100) / 100; // Prevent negative balance
      }

      console.log(`💰 FRONTEND CALCULATION: ${currentBalance} ${operationType} ${amountToProcess} = ${newBalance}`);

      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          creditBalance: newBalance
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update credit balance');
      }

      const actionText = operationType === 'add' ? 'added' : 'deducted';
      setSuccessMessage(`Successfully ${actionText} ${amount} credits. New balance: ${newBalance.toLocaleString()}`);
      
      // Reset form
      setAmount(0);
      setReason('');
      
      // Refresh user details
      fetchUserDetails();

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update credit balance');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount);
  };

  if (isLoading) {
    return (
      <DashboardLayout 
        title="Wallet Management"
        subtitle="Loading user wallet information..."
      >
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading wallet information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentBalance = parseFloat(userDetails?.creditBalance?.toString() || '0');
  const amountValue = parseFloat(amount.toString() || '0');
  const projectedBalance = operationType === 'add' 
    ? Math.round((currentBalance + amountValue) * 100) / 100
    : Math.round(Math.max(0, currentBalance - amountValue) * 100) / 100;

  return (
    <DashboardLayout 
      title="Wallet Management"
      subtitle={userDetails ? `Manage credits for ${userDetails.name}` : 'Manage user credits'}
    >
      <div className="p-6 max-w-4xl mx-auto">
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
          </div>
        </div>

        {/* Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <X className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Save className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info & Current Balance */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  <span>Current Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {userDetails && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-blue-600 font-bold text-xl">
                          {userDetails.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{userDetails.name}</h3>
                      <p className="text-sm text-gray-500">{userDetails.email}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white text-center">
                      <p className="text-green-100 text-sm font-medium">Current Credits</p>
                      <p className="text-3xl font-bold">{currentBalance.toLocaleString()}</p>
                    </div>

                    <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>User ID:</span>
                        <span className="font-mono text-xs">{userDetails.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Role:</span>
                        <span className="capitalize font-medium">{userDetails.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Joined:</span>
                        <span>{new Date(userDetails.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Credit Management */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <span>Credit Management</span>
                </CardTitle>
                <CardDescription>
                  Add or deduct credits from user's account
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Operation Type Selection */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Operation Type</label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setOperationType('add')}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        operationType === 'add'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">Add Credits</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOperationType('deduct')}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        operationType === 'deduct'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-red-300'
                      }`}
                    >
                      <Minus className="h-4 w-4" />
                      <span className="font-medium">Deduct Credits</span>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                      className="pl-10 text-lg font-semibold"
                      placeholder="Enter amount"
                      min="0"
                    />
                  </div>
                  
                  {/* Quick Amount Buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[10, 50, 100, 500, 1000, 5000].map((quickAmount) => (
                      <button
                        key={quickAmount}
                        type="button"
                        onClick={() => handleQuickAmount(quickAmount)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md border transition-colors"
                      >
                        {quickAmount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason Input */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Reason</label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for credit adjustment"
                    className="font-medium"
                  />
                </div>

                {/* Balance Preview */}
                {amount > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-800 mb-2">Transaction Preview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Current Balance:</span>
                        <span className="font-mono">{currentBalance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          {operationType === 'add' ? 'Credits Added:' : 'Credits Deducted:'}
                        </span>
                        <span className={`font-mono ${operationType === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                          {operationType === 'add' ? '+' : '-'}{amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold text-base border-t pt-2">
                        <span>New Balance:</span>
                        <span className="font-mono">{projectedBalance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreditUpdate}
                    disabled={isUpdating || amount <= 0 || !reason.trim()}
                    className={`${
                      operationType === 'add'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isUpdating ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {operationType === 'add' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                        <span>
                          {operationType === 'add' ? 'Add Credits' : 'Deduct Credits'}
                        </span>
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}