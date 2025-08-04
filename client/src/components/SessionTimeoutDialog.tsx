import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface SessionTimeoutDialogProps {
  open: boolean;
  timeLeft: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutDialog({
  open,
  timeLeft,
  onExtend,
  onLogout,
}: SessionTimeoutDialogProps) {
  const [countdown, setCountdown] = useState(timeLeft);

  useEffect(() => {
    setCountdown(timeLeft);
  }, [timeLeft]);

  const progress = ((30 - countdown) / 30) * 100;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <AlertTriangle className="h-5 w-5" />
            </motion.div>
            Session Timeout Warning
          </DialogTitle>
          <DialogDescription>
            Your session will expire in <strong>{countdown} seconds</strong> due to inactivity.
            Would you like to extend your session?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Time remaining</span>
              <span className="font-mono font-medium">
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                {String(countdown % 60).padStart(2, '0')}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              To protect your account, we automatically log out inactive sessions.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="flex-1"
          >
            Logout Now
          </Button>
          <Button
            onClick={onExtend}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Extend Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}