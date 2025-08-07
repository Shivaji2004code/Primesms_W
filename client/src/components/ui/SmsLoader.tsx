import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Wifi } from 'lucide-react';

interface SmsLoaderProps {
  visible: boolean;
  message?: string;
}

const SmsLoader = ({ visible, message = 'Please wait...' }: SmsLoaderProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-4 border border-gray-200"
          >
            {/* SMS Bubble Animation */}
            <div className="relative mb-6">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <MessageSquare className="w-8 h-8 text-white" />
              </motion.div>
              
              {/* Typing dots animation */}
              <div className="flex justify-center space-x-1">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: index * 0.3,
                      ease: "easeInOut"
                    }}
                    className="w-2 h-2 bg-green-500 rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <h3 className="font-semibold text-gray-900 text-lg">
                {message}
              </h3>
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                <Wifi className="w-4 h-4" />
                <span>Connecting to SMS Gateway...</span>
              </div>
            </motion.div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SmsLoader;