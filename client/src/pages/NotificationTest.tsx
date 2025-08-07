import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, TestTube, Play, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useNotifier } from '../contexts/NotificationContext';
import { useNotifications } from '../contexts/NotificationContext';
import DashboardLayout from '../components/layout/DashboardLayout';

const NotificationTest = () => {
  const notifier = useNotifier();
  const { notifications, clearAllNotifications } = useNotifications();
  const [testCount, setTestCount] = useState(0);

  const testNotifications = [
    { type: 'success', message: 'Campaign sent successfully to 150 recipients!' },
    { type: 'error', message: 'Failed to load WhatsApp templates. Please try again.' },
    { type: 'warning', message: 'Your credit balance is running low (25 credits remaining).' },
    { type: 'info', message: 'New template approval received for "Welcome Message".' },
    { type: 'success', message: 'File uploaded successfully. Processing 200 contacts.' },
    { type: 'error', message: 'API rate limit exceeded. Please wait 60 seconds.' },
    { type: 'warning', message: 'Some phone numbers in your list are invalid.' },
    { type: 'info', message: 'Your WhatsApp Business account verification is pending.' },
  ];

  const triggerTestNotification = () => {
    const notification = testNotifications[testCount % testNotifications.length];
    (notifier as any)[notification.type](notification.message);
    setTestCount(testCount + 1);
  };

  const triggerMultipleNotifications = () => {
    setTimeout(() => notifier.success('Message 1: Campaign created successfully'), 100);
    setTimeout(() => notifier.info('Message 2: Processing recipients...'), 600);
    setTimeout(() => notifier.warning('Message 3: Some numbers are invalid'), 1100);
    setTimeout(() => notifier.error('Message 4: Sending failed for 5 numbers'), 1600);
    setTimeout(() => notifier.success('Message 5: Campaign completed!'), 2100);
  };

  const simulateRealWorldFlow = () => {
    // Simulate a real campaign flow
    notifier.info('Starting campaign setup...');
    
    setTimeout(() => notifier.success('Template loaded successfully'), 1000);
    setTimeout(() => notifier.info('Validating 150 phone numbers...'), 2000);
    setTimeout(() => notifier.warning('3 invalid numbers found and removed'), 3000);
    setTimeout(() => notifier.info('Sending messages to 147 recipients...'), 4000);
    setTimeout(() => notifier.success('Campaign sent! 145 delivered, 2 failed'), 6000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Notification System Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test and verify the real-time notification system across all pages
          </p>
        </motion.div>

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TestTube className="w-5 h-5 text-blue-600" />
                  <span>Single Notifications</span>
                </CardTitle>
                <CardDescription>
                  Test individual notification types one by one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => notifier.success('Success notification test!')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Success
                  </Button>
                  <Button
                    onClick={() => notifier.error('Error notification test!')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Error
                  </Button>
                  <Button
                    onClick={() => notifier.warning('Warning notification test!')}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Warning
                  </Button>
                  <Button
                    onClick={() => notifier.info('Info notification test!')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Info
                  </Button>
                </div>
                <Button
                  onClick={triggerTestNotification}
                  variant="outline"
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Cycle Through Real Messages ({testCount}/8)
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <span>Bulk Testing</span>
                </CardTitle>
                <CardDescription>
                  Test multiple notifications and real-world scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={triggerMultipleNotifications}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Send 5 Sequential Notifications
                </Button>
                <Button
                  onClick={simulateRealWorldFlow}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Simulate Campaign Flow
                </Button>
                <Button
                  onClick={clearAllNotifications}
                  variant="outline"
                  className="w-full"
                >
                  Clear All Notifications
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Notification Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Notification Status</CardTitle>
              <CardDescription>
                Current state of the notification system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {notifications.length}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {notifications.filter(n => n.type === 'success').length}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Success</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {notifications.filter(n => n.type === 'error').length}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">Errors</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {notifications.filter(n => !n.read).length}
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">Unread</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Instructions:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Check the notification bell (🔔) in the top header</li>
                  <li>• Click the bell to see the dropdown with all notifications</li>
                  <li>• Notifications should show unread count badge</li>
                  <li>• Success/Info messages auto-dismiss after 6 seconds</li>
                  <li>• Error/Warning messages persist until manually dismissed</li>
                  <li>• Try navigating to other pages - notifications should persist</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationTest;