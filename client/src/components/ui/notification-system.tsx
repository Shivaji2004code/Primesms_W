import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from './button';
import { cn } from '../../lib/utils';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    title: 'text-green-900',
    description: 'text-green-700',
    button: 'text-green-600 hover:text-green-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    description: 'text-red-700',
    button: 'text-red-600 hover:text-red-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    description: 'text-yellow-700',
    button: 'text-yellow-600 hover:text-yellow-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    description: 'text-blue-700',
    button: 'text-blue-600 hover:text-blue-700',
  },
};

export function NotificationSystem() {
  const { notifications, removeNotification } = useStore();

  // Auto-scroll to latest notification
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = document.getElementById(`notification-${notifications[notifications.length - 1].id}`);
      latestNotification?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [notifications]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {notifications.map((notification) => {
        const IconComponent = iconMap[notification.type];
        const colors = colorMap[notification.type];

        return (
          <div
            key={notification.id}
            id={`notification-${notification.id}`}
            className={cn(
              "animate-in slide-in-from-right-5 duration-300",
              "rounded-lg border p-4 shadow-lg",
              colors.bg,
              colors.border
            )}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <IconComponent className={cn("h-5 w-5", colors.icon)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={cn("text-sm font-semibold", colors.title)}>
                  {notification.title}
                </h4>
                {notification.description && (
                  <p className={cn("mt-1 text-sm", colors.description)}>
                    {notification.description}
                  </p>
                )}
                
                {notification.action && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={notification.action.onClick}
                      className={cn("text-xs font-medium", colors.button, "h-auto p-0")}
                    >
                      {notification.action.label}
                    </Button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => removeNotification(notification.id)}
                className={cn(
                  "flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors",
                  colors.button
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Progress bar for timed notifications */}
            {!notification.persistent && (
              <div className="mt-3 h-1 bg-black/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-current opacity-60 animate-pulse"
                  style={{
                    animationDuration: `${notification.duration || 5000}ms`,
                    animationTimingFunction: 'linear',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Bell notification indicator for header
export function NotificationBell() {
  const { notifications, clearAllNotifications } = useStore();
  const unreadCount = notifications.length;

  if (unreadCount === 0) {
    return (
      <Button variant="ghost" size="sm">
        <Bell className="h-5 w-5 text-gray-600" />
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={clearAllNotifications}
        className="relative"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      </Button>
    </div>
  );
}