import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from '../components/ui/use-toast';
import { useLoading } from '../contexts/LoadingContext';
import { useNotifier } from '../contexts/NotificationContext';
import { apiRequest } from '../lib/api';
import type { LoginRequest } from '../types';

interface LoginResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    role: 'user' | 'admin';
    creditBalance: number;
  };
}

type ViewMode = 'login' | 'forgot-password' | 'verify-otp' | 'reset-password';

export default function Login() {
  const navigate = useNavigate();
  const { setLoading } = useLoading();
  const notifier = useNotifier();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string>('');
  const [currentView, setCurrentView] = useState<ViewMode>('login');

  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: ''
  });

  // Forgot password states
  const [forgotPasswordData, setForgotPasswordData] = useState({
    username: '',
    phone: ''
  });
  const [otpData, setOtpData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [otpSent, setOtpSent] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setIsLoading(true);
    setLoading(true, 'Logging you in...');

    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data: LoginResponse = await response.json();
      
      // Store user data in localStorage for the frontend
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Show success notification
      notifier.success('Login successful! Redirecting to dashboard...');
      
      // Redirect based on user role with a small delay to show the toast
      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/user/dashboard');
        }
      }, 500);

    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setServerError(errorMessage);
      
      notifier.error(errorMessage);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleChange = (field: keyof LoginRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Forgot password handlers
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    
    if (!forgotPasswordData.username.trim() || !forgotPasswordData.phone.trim()) {
      setServerError('Username and phone number are required');
      return;
    }

    setIsLoading(true);
    setLoading(true, 'Sending OTP to WhatsApp...');
    try {
      const response = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotPasswordData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      if (data.success && data.otpSent) {
        setOtpSent(true);
        setCurrentView('verify-otp');
        notifier.success('OTP sent to your WhatsApp number');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      setServerError(errorMessage);
      notifier.error(errorMessage);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    
    if (!otpData.otp.trim()) {
      setServerError('OTP is required');
      return;
    }

    setIsLoading(true);
    setLoading(true, 'Verifying OTP...');
    try {
      const response = await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotPasswordData.username,
          otp: otpData.otp,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      if (data.success && data.resetAllowed) {
        setCurrentView('reset-password');
        notifier.success('OTP verified. You can now reset your password.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
      setServerError(errorMessage);
      notifier.error(errorMessage);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    
    if (!otpData.newPassword.trim() || !otpData.confirmPassword.trim()) {
      setServerError('Both password fields are required');
      return;
    }

    if (otpData.newPassword !== otpData.confirmPassword) {
      setServerError('Passwords do not match');
      return;
    }

    if (otpData.newPassword.length < 6) {
      setServerError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setLoading(true, 'Resetting password...');
    try {
      const response = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotPasswordData.username,
          newPassword: otpData.newPassword,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      if (data.success) {
        notifier.success('Password reset successfully. Please login with your new password.');
        
        // Reset all states and go back to login
        setCurrentView('login');
        setForgotPasswordData({ username: '', phone: '' });
        setOtpData({ otp: '', newPassword: '', confirmPassword: '' });
        setOtpSent(false);
        setFormData({ username: forgotPasswordData.username, password: '' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setServerError(errorMessage);
      notifier.error(errorMessage);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setCurrentView('login');
    setForgotPasswordData({ username: '', phone: '' });
    setOtpData({ otp: '', newPassword: '', confirmPassword: '' });
    setOtpSent(false);
    setServerError('');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to Prime SMS
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        {/* Main Form */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="space-y-1">
            {currentView !== 'login' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetToLogin}
                className="self-start mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Button>
            )}
            <CardTitle className="text-2xl font-semibold text-center">
              {currentView === 'login' && 'Login'}
              {currentView === 'forgot-password' && 'Forgot Password'}
              {currentView === 'verify-otp' && 'Verify OTP'}
              {currentView === 'reset-password' && 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {currentView === 'login' && 'Enter your credentials to access your account'}
              {currentView === 'forgot-password' && 'Enter your username and phone number to receive OTP'}
              {currentView === 'verify-otp' && 'Enter the 6-digit OTP sent to your WhatsApp'}
              {currentView === 'reset-password' && 'Create your new password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Login Form */}
            {currentView === 'login' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {serverError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {serverError}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className={`${errors.username ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className={`pr-10 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>

                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => setCurrentView('forgot-password')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot Password?
                  </button>
                  
                  <div>
                    <span className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                        Sign up
                      </Link>
                    </span>
                  </div>
                </div>
              </form>
            )}

            {/* Forgot Password Form */}
            {currentView === 'forgot-password' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                {serverError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {serverError}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="forgot-username" className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <Input
                    id="forgot-username"
                    type="text"
                    value={forgotPasswordData.username}
                    onChange={(e) => setForgotPasswordData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="forgot-phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <Input
                    id="forgot-phone"
                    type="tel"
                    value={forgotPasswordData.phone}
                    onChange={(e) => setForgotPasswordData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number (e.g., +911234567890)"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Enter your phone number in international format
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </form>
            )}

            {/* OTP Verification Form */}
            {currentView === 'verify-otp' && (
              <form onSubmit={handleOtpVerification} className="space-y-6">
                {serverError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {serverError}
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  OTP has been sent to your WhatsApp number ending in {forgotPasswordData.phone.slice(-4)}
                </div>

                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                    6-Digit OTP
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    value={otpData.otp}
                    onChange={(e) => setOtpData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="Enter 6-digit OTP"
                    disabled={isLoading}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading || otpData.otp.length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </form>
            )}

            {/* Reset Password Form */}
            {currentView === 'reset-password' && (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                {serverError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {serverError}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    value={otpData.newPassword}
                    onChange={(e) => setOtpData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={otpData.confirmPassword}
                    onChange={(e) => setOtpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}