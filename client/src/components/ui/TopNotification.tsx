import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from './button';

const TopNotification = () => {
  const { notifications, clearNotification } = useNotifications();

  // Show only the most recent unread notification
  const activeNotification = notifications.find(n => !n.read) || null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <AnimatePresence mode="wait">
        {activeNotification && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`${getBackgroundColor(activeNotification.type)} backdrop-blur-sm shadow-lg border rounded-xl px-4 py-3 max-w-md mx-auto`}
          >
            <div className="flex items-center space-x-3">
              {getIcon(activeNotification.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">
                  {activeNotification.message}
                </p>
                <p className="text-xs opacity-70 mt-0.5">
                  {new Date(activeNotification.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearNotification(activeNotification.id)}
                className="p-1 h-auto w-auto hover:bg-black/10 rounded-full opacity-70 hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            
            {/* Progress bar for auto-dismiss */}
            {(activeNotification.type === 'success' || activeNotification.type === 'info') && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                className="h-0.5 bg-current opacity-30 rounded-full mt-2"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopNotification;