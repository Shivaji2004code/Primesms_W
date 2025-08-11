// Manual Template Sync Button Component
import React, { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface TemplateSyncButtonProps {
  userId: string;
  templateName?: string;
  language?: string;
  onSyncComplete?: () => void;
}

export function TemplateSyncButton({ 
  userId, 
  templateName, 
  language = 'en_US',
  onSyncComplete 
}: TemplateSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      const requestBody: any = { userId };
      
      // If specific template provided, sync only that template
      if (templateName) {
        requestBody.name = templateName;
        requestBody.language = language;
      }

      console.log('🔄 [SYNC] Starting manual sync:', requestBody);

      const response = await fetch('/api/templates/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Sync Successful',
          description: `Updated ${result.updated} template${result.updated !== 1 ? 's' : ''}`,
          variant: 'default'
        });

        console.log('✅ [SYNC] Sync completed:', result);

        // Call onSyncComplete callback if provided
        if (onSyncComplete) {
          onSyncComplete();
        }

      } else {
        throw new Error(result.message || 'Sync failed');
      }

    } catch (error: any) {
      console.error('❌ [SYNC] Sync error:', error);
      
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync template status',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      size="sm"
      variant="outline"
      className="ml-2"
    >
      {isSyncing ? (
        <>
          <span className="animate-spin mr-2">⟳</span>
          Syncing...
        </>
      ) : (
        <>
          <span className="mr-2">🔄</span>
          {templateName ? `Sync ${templateName}` : 'Sync All'}
        </>
      )}
    </Button>
  );
}

// Example usage in your Templates page:
export function TemplateRowWithSync({ template, userId }: { template: any; userId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSyncComplete = () => {
    // Force re-render or refetch templates
    setRefreshKey(prev => prev + 1);
    
    // If you have a refetch function from your data fetching hook:
    // refetchTemplates();
  };

  return (
    <div className="template-row flex items-center justify-between">
      <div>
        <span className="font-medium">{template.name}</span>
        <span className={`ml-2 px-2 py-1 rounded text-xs ${
          template.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
          template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {template.status}
        </span>
      </div>
      
      <div className="flex items-center">
        <TemplateSyncButton
          userId={userId}
          templateName={template.name}
          language={template.language}
          onSyncComplete={handleSyncComplete}
        />
      </div>
    </div>
  );
}