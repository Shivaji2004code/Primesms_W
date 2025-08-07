import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, BarChart3, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useLoading } from '../contexts/LoadingContext';
import { useNotifier } from '../contexts/NotificationContext';
import { apiRequest } from '../lib/api';
import DashboardLayout from '../components/layout/DashboardLayout';

interface LogStats {
  messageLogsCount: number;
  campaignLogsCount: number;
  totalCount: number;
  thresholdDate: string;
}

const AdminLogCleanup = () => {
  const { setLoading } = useLoading();
  const notifier = useNotifier();
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Fetch log cleanup stats
  const fetchStats = async () => {
    try {
      setLoading(true, 'Fetching log statistics...');
      const response = await apiRequest('/api/logs/cleanup/stats');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        notifier.info('Log statistics updated');
      } else {
        notifier.error('Failed to fetch log statistics');
      }
    } catch (error) {
      notifier.error('Network error while fetching statistics');
    } finally {
      setLoading(false);
    }
  };

  // Perform manual cleanup
  const performCleanup = async () => {
    if (!stats || stats.totalCount === 0) {
      notifier.warning('No logs to cleanup');
      return;
    }

    try {
      setIsCleaningUp(true);
      setLoading(true, 'Cleaning up old logs...');
      
      const response = await apiRequest('/api/logs/cleanup', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        notifier.success(`Successfully deleted ${data.deleted.totalDeleted} log entries`);
        
        // Refresh stats
        await fetchStats();
      } else {
        const errorData = await response.json();
        notifier.error(errorData.error || 'Failed to cleanup logs');
      }
    } catch (error) {
      notifier.error('Network error during cleanup');
    } finally {
      setIsCleaningUp(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Log Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and cleanup old system logs automatically
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Message Logs</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.messageLogsCount.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for cleanup
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campaign Logs</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.campaignLogsCount.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for cleanup
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Old Logs</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats?.totalCount.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Older than 90 days
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Cleanup Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <span>Log Cleanup</span>
              </CardTitle>
              <CardDescription>
                Automatically removes logs older than 90 days. The cleanup job runs daily at 2:00 AM UTC.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {stats && stats.thresholdDate && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Cleanup Threshold
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All logs created before {formatDate(stats.thresholdDate)} will be deleted.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {stats && stats.totalCount > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {stats && stats.totalCount > 0 
                        ? `${stats.totalCount.toLocaleString()} logs ready for cleanup`
                        : 'No logs need cleanup'
                      }
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats && stats.totalCount > 0 
                        ? 'Click below to perform manual cleanup now'
                        : 'All logs are within the retention period'
                      }
                    </p>
                  </div>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={fetchStats}
                    disabled={isCleaningUp}
                  >
                    Refresh Stats
                  </Button>
                  <Button
                    onClick={performCleanup}
                    disabled={isCleaningUp || !stats || stats.totalCount === 0}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clean Up Now
                  </Button>
                </div>
              </div>

              {/* Test Notifications */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Test Notifications
                </h3>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => notifier.success('This is a success notification!')}
                  >
                    Test Success
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => notifier.warning('This is a warning notification!')}
                  >
                    Test Warning
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => notifier.error('This is an error notification!')}
                  >
                    Test Error
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => notifier.info('This is an info notification!')}
                  >
                    Test Info
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AdminLogCleanup;