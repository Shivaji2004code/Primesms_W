// API base URL helper - uses relative paths in production
const getApiBaseUrl = () => {
  // In production build, use relative paths (same-origin)
  if (import.meta.env.PROD) {
    return '';
  }
  // In development, use VITE_API_URL or fallback
  return import.meta.env.VITE_API_URL || 'http://localhost:5050';
};

// Global fetch wrapper to handle authentication and session expiry
let authStateUpdater: ((state: { user: null, isLoading: false, isAuthenticated: false, lastActivity: number }) => void) | null = null;

export function setAuthStateUpdater(updater: ((state: { user: null, isLoading: false, isAuthenticated: false, lastActivity: number }) => void) | null) {
  authStateUpdater = updater;
}

export async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  // If we get a 401, clear the authentication state
  if (response.status === 401 && authStateUpdater) {
    // Clear localStorage
    localStorage.removeItem('user');
    
    // Update auth state to trigger redirect
    authStateUpdater({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      lastActivity: Date.now(),
    });
  }

  return response;
}

// Helper function to build API URLs
export function apiUrl(path: string) {
  const base = getApiBaseUrl();
  return `${base}${path}`;
}