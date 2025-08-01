import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import UserRoute from './components/UserRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserDetails from './pages/AdminUserDetails';
import UserDashboard from './pages/UserDashboard';
import ManageTemplatesWrapper from './components/ManageTemplatesWrapper';
import CreateTemplateWrapper from './components/CreateTemplateWrapper';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute requireAuth={false}>
              <Landing />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <ProtectedRoute requireAuth={false}>
              <Signup />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes */}
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
        
        {/* User routes */}
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
      </Routes>
    </Router>
  );
}

export default App;
