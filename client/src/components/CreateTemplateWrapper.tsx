import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateTemplate from '@/pages/CreateTemplate';
import DashboardLayout from './layout/DashboardLayout';
import type { User } from '@/types';

export default function CreateTemplateWrapper() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const user: User = JSON.parse(userData);
    if (user.role !== 'user') {
      navigate('/admin/dashboard');
      return;
    }

    setCurrentUser(user);
    setIsLoading(false);
  }, [navigate]);

  if (isLoading || !currentUser) {
    return (
      <DashboardLayout 
        title="Create Template"
        subtitle="Design a new WhatsApp message template for your campaigns."
      >
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading template creator...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Create Template"
      subtitle="Design a new WhatsApp message template for your campaigns."
    >
      <CreateTemplate currentUser={currentUser} />
    </DashboardLayout>
  );
}