import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from '../components/ui/use-toast';
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

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string>('');

  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: ''
  });

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

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data: LoginResponse = await response.json();
      
      // Store user data in localStorage for the frontend
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Show success message
      toast({
        title: 'Success!',
        description: 'Login successful',
        variant: 'default',
      });
      
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
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof LoginRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDemoLogin = (username: string, password: string) => {
    setFormData({ username, password });
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

        {/* Login Form */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign up
                  </Link>
                </span>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-blue-50 border border-blue-200">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-blue-900 mb-3">Demo Credentials</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin', 'admin123')}
                className="w-full text-left px-3 py-2 text-xs bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <strong className="text-blue-900">Admin:</strong> admin / admin123
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('user', 'user123')}
                className="w-full text-left px-3 py-2 text-xs bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <strong className="text-blue-900">User:</strong> user / user123
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}