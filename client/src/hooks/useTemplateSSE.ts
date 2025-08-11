// Minimal React hook for Template SSE subscriptions
import { useEffect, useRef } from 'react';

export interface TemplateUpdateEvent {
  type: 'template_update';
  name: string;
  language: string;
  status: string;
  category: string | null;
  reason: string | null;
  at: string;
  reviewedAt?: string;
  source?: string;
}

/**
 * React hook for subscribing to template status updates via Server-Sent Events
 * @param userId - User ID to subscribe to updates for
 * @param onEvent - Callback function to handle template update events
 * @param enabled - Whether the subscription is enabled (default: true)
 * @returns cleanup function to manually close the connection
 */
export function useTemplateSSE(
  userId: string,
  onEvent: (event: TemplateUpdateEvent) => void,
  enabled: boolean = true
): () => void {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const cleanup = () => {
    if (eventSourceRef.current) {
      console.log('🔌 [TEMPLATE_SSE] Closing SSE connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const connect = () => {
    if (!userId || !enabled) return;

    console.log(`📡 [TEMPLATE_SSE] Connecting to template updates for user ${userId}`);
    
    const eventSource = new EventSource(`/api/realtime/templates/${encodeURIComponent(userId)}`, {
      withCredentials: true
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`✅ [TEMPLATE_SSE] Connected to template updates for user ${userId}`);
      reconnectAttemptsRef.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        console.log('📋 [TEMPLATE_SSE] Received event:', data);
        
        // Handle connection confirmation
        if (data.type === 'connection' && data.status === 'connected') {
          console.log(`🔗 [TEMPLATE_SSE] Connection confirmed for user ${userId}`);
          return;
        }

        // Handle template update events
        if (data.type === 'template_update') {
          onEvent(data as TemplateUpdateEvent);
        }
      } catch (error) {
        console.error('❌ [TEMPLATE_SSE] Error parsing SSE message:', error, event.data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ [TEMPLATE_SSE] SSE connection error:', error);
      
      // Close the current connection
      eventSource.close();
      eventSourceRef.current = null;
      
      // Attempt to reconnect with exponential backoff
      const maxAttempts = 5;
      const baseDelay = 1000;
      
      if (reconnectAttemptsRef.current < maxAttempts) {
        const delay = baseDelay * Math.pow(2, reconnectAttemptsRef.current);
        reconnectAttemptsRef.current++;
        
        console.log(`🔄 [TEMPLATE_SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxAttempts})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (enabled) {
            connect();
          }
        }, delay);
      } else {
        console.error('❌ [TEMPLATE_SSE] Max reconnection attempts reached');
      }
    };
  };

  useEffect(() => {
    if (enabled && userId) {
      connect();
    } else {
      cleanup();
    }

    return cleanup;
  }, [userId, enabled]);

  // Return cleanup function for manual use
  return cleanup;
}

/**
 * Subscribe to template SSE updates (non-React version)
 * @param userId User ID to subscribe to
 * @param onEvent Callback for template update events  
 * @returns cleanup function
 */
export function subscribeTemplateSSE(
  userId: string, 
  onEvent: (event: TemplateUpdateEvent) => void
): () => void {
  console.log(`📡 [TEMPLATE_SSE] Starting subscription for user ${userId}`);
  
  const eventSource = new EventSource(`/api/realtime/templates/${encodeURIComponent(userId)}`, {
    withCredentials: true
  });

  eventSource.onopen = () => {
    console.log(`✅ [TEMPLATE_SSE] Connected to template updates`);
  };

  eventSource.onmessage = (messageEvent) => {
    try {
      const data = JSON.parse(messageEvent.data);
      
      if (data.type === 'template_update') {
        onEvent(data as TemplateUpdateEvent);
      }
    } catch (error) {
      console.error('❌ [TEMPLATE_SSE] Error parsing message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('❌ [TEMPLATE_SSE] Connection error:', error);
    eventSource.close();
    
    // Simple reconnect after 3 seconds
    setTimeout(() => subscribeTemplateSSE(userId, onEvent), 3000);
  };

  return () => {
    console.log('🔌 [TEMPLATE_SSE] Closing connection');
    eventSource.close();
  };
}