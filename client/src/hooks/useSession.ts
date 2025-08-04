import { useState, useEffect, useCallback } from 'react';

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_TIME = 30 * 1000; // 30 seconds before timeout

interface SessionState {
  isActive: boolean;
  showWarning: boolean;
  timeLeft: number;
  lastActivity: number;
}

export function useSession(onSessionExpire?: () => void) {
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: true,
    showWarning: false,
    timeLeft: SESSION_TIMEOUT,
    lastActivity: Date.now(),
  });

  const updateActivity = useCallback(() => {
    const now = Date.now();
    setSessionState(prev => ({
      ...prev,
      lastActivity: now,
      isActive: true,
      showWarning: false,
      timeLeft: SESSION_TIMEOUT,
    }));
  }, []);

  const extendSession = useCallback(() => {
    updateActivity();
  }, [updateActivity]);

  const handleSessionExpire = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      isActive: false,
      showWarning: false,
      timeLeft: 0,
    }));
    onSessionExpire?.();
  }, [onSessionExpire]);

  const dismissWarning = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      showWarning: false,
    }));
    extendSession();
  }, [extendSession]);

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateActivity]);

  // Session timeout logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - sessionState.lastActivity;
      const timeLeft = Math.max(0, SESSION_TIMEOUT - timeSinceActivity);

      if (timeLeft === 0 && sessionState.isActive) {
        handleSessionExpire();
      } else if (timeLeft <= WARNING_TIME && timeLeft > 0 && !sessionState.showWarning && sessionState.isActive) {
        setSessionState(prev => ({
          ...prev,
          showWarning: true,
          timeLeft,
        }));
      } else if (sessionState.showWarning && timeLeft > WARNING_TIME) {
        setSessionState(prev => ({
          ...prev,
          showWarning: false,
          timeLeft,
        }));
      } else {
        setSessionState(prev => ({
          ...prev,
          timeLeft,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState.lastActivity, sessionState.isActive, sessionState.showWarning, handleSessionExpire]);

  return {
    ...sessionState,
    extendSession,
    dismissWarning,
    updateActivity,
    warningTimeLeft: Math.ceil(sessionState.timeLeft / 1000),
  };
}