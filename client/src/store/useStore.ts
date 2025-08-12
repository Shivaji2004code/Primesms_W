import { create } from 'zustand';

interface AppState {
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Navigation
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Loading states
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;
  
  // Notifications
  notifications: Array<{
    id: string;
    title: string;
    description?: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timestamp: number;
    action?: {
      label: string;
      onClick: () => void;
    };
    duration?: number;
    persistent?: boolean;
  }>;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // User credits
  creditBalance: number;
  setCreditBalance: (balance: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Theme
  theme: (typeof window !== 'undefined' && localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },
  
  // Navigation
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Loading states
  loadingStates: {},
  setLoading: (key, loading) => set((state) => ({
    loadingStates: { ...state.loadingStates, [key]: loading }
  })),
  
  // Notifications
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();
    const duration = notification.duration || 4000; // Default to 4 seconds
    
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id, timestamp }]
    }));
    
    // Auto remove after specified duration (unless persistent)
    if (!notification.persistent) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  clearAllNotifications: () => set({ notifications: [] }),
  
  // User credits
  creditBalance: 0,
  setCreditBalance: (balance) => set({ creditBalance: balance }),
}));

// Initialize theme on mount
if (typeof window !== 'undefined') {
  const theme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
  document.documentElement.classList.toggle('dark', theme === 'dark');
}