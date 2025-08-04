import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminRoute } from './components/guards/AdminRoute';
import { UserRoute } from './components/guards/UserRoute';
import { Toaster } from './components/ui/toaster';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserDetails from './pages/AdminUserDetails';
import AdminUserSettings from './pages/AdminUserSettings';
import AdminUserWallet from './pages/AdminUserWallet';
import AdminUserTemplates from './pages/AdminUserTemplates';
import UserDashboard from './pages/UserDashboard';
import ManageTemplatesWrapper from './components/ManageTemplatesWrapper';
import CreateTemplateWrapper from './components/CreateTemplateWrapper';
import WhatsAppBulkMessagingPage from './pages/WhatsAppBulkMessaging';
import CustomizeMessage from './pages/CustomizeMessage';
import ManageReports from './pages/ManageReports';
import Support from './pages/Support';
import APIManagement from './pages/APIManagement';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public routes - use old Layout */}
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/signup" element={<Layout><Signup /></Layout>} />
          
          {/* Dashboard routes - use DashboardLayout (already included in components) */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users/:id/details" 
            element={
              <AdminRoute>
                <AdminUserDetails />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users/:id/settings" 
            element={
              <AdminRoute>
                <AdminUserSettings />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users/:id/wallet" 
            element={
              <AdminRoute>
                <AdminUserWallet />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users/:id/templates" 
            element={
              <AdminRoute>
                <AdminUserTemplates />
              </AdminRoute>
            } 
          />
          
          <Route 
            path="/user/dashboard" 
            element={
              <UserRoute>
                <UserDashboard />
              </UserRoute>
            } 
          />
          <Route 
            path="/user/templates" 
            element={
              <UserRoute>
                <ManageTemplatesWrapper />
              </UserRoute>
            } 
          />
          <Route 
            path="/user/templates/create" 
            element={
              <UserRoute>
                <CreateTemplateWrapper />
              </UserRoute>
            } 
          />
          <Route 
            path="/user/templates/:id/edit" 
            element={
              <UserRoute>
                <CreateTemplateWrapper />
              </UserRoute>
            } 
          />
          <Route 
            path="/user/whatsapp-bulk" 
            element={
              <UserRoute>
                <WhatsAppBulkMessagingPage />
              </UserRoute>
            } 
          />
          <Route 
            path="/user/api-management" 
            element={
              <UserRoute>
                <APIManagement />
              </UserRoute>
            } 
          />
          <Route 
            path="/user/customize-message" 
            element={
              <UserRoute>
                <CustomizeMessage />
              </UserRoute>
            } 
          />
          <Route 
            path="/user/manage-reports" 
            element={
              <UserRoute>
                <ManageReports />
              </UserRoute>
            } 
          />
          <Route 
            path="/user/support" 
            element={
              <UserRoute>
                <Support />
              </UserRoute>
            } 
          />
          
          {/* 404 Route */}
          <Route 
            path="*" 
            element={
              <Layout>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-4">Page not found</p>
                    <button 
                      onClick={() => window.history.back()}
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      Go back
                    </button>
                  </div>
                </div>
              </Layout>
            } 
          />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
