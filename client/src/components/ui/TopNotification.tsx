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
      case 'success': return <CheckCircle className="w-5 h-5 text-white" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-white" />;
      case 'error': return <XCircle className="w-5 h-5 text-white" />;
      default: return <Info className="w-5 h-5 text-white" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'warning': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'error': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      default: return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <AnimatePresence mode="wait">
        {activeNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`${getBackgroundColor(activeNotification.type)} text-white shadow-lg`}
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getIcon(activeNotification.type)}
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {activeNotification.message}
                    </p>
                    <p className="text-xs text-blue-100 mt-1">
                      {new Date(activeNotification.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearNotification(activeNotification.id)}
                  className="text-white hover:bg-white/20 p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Progress bar for auto-dismiss */}
            {(activeNotification.type === 'success' || activeNotification.type === 'info') && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
                className="h-1 bg-white/30"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopNotification;