// Direct Template Sync Button - Emergency Fix for Template Status Issues
import React, { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface DirectSyncButtonProps {
  userId: string;
  onSyncComplete?: () => void;
}

export function DirectSyncButton({ userId, onSyncComplete }: DirectSyncButtonProps) {
  const [isComparing, setIsComparing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const { toast } = useToast();

  const handleCompare = async () => {
    setIsComparing(true);
    
    try {
      console.log('🔍 [DIRECT_SYNC] Starting template comparison...');

      const response = await fetch(`/api/templates/compare/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setComparisonResult(result);
        
        toast({
          title: 'Comparison Complete',
          description: `Found ${result.summary.needingUpdate} template(s) needing sync`,
          variant: 'default'
        });

        console.log('📊 [DIRECT_SYNC] Comparison result:', result);

      } else {
        throw new Error(result.message || 'Comparison failed');
      }

    } catch (error: any) {
      console.error('❌ [DIRECT_SYNC] Comparison error:', error);
      
      toast({
        title: 'Comparison Failed',
        description: error.message || 'Failed to compare template status',
        variant: 'destructive'
      });
    } finally {
      setIsComparing(false);
    }
  };

  const handleDirectSync = async () => {
    setIsSyncing(true);
    
    try {
      console.log('🚨 [DIRECT_SYNC] Starting emergency direct sync...');

      const response = await fetch(`/api/templates/sync-direct/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: '🚨 Emergency Sync Complete',
          description: `Force updated ${result.updated} template(s) from Meta`,
          variant: 'default'
        });

        console.log('✅ [DIRECT_SYNC] Direct sync completed:', result);

        // Reset comparison result
        setComparisonResult(null);

        // Call onSyncComplete callback if provided
        if (onSyncComplete) {
          onSyncComplete();
        }

      } else {
        throw new Error(result.message || 'Direct sync failed');
      }

    } catch (error: any) {
      console.error('❌ [DIRECT_SYNC] Direct sync error:', error);
      
      toast({
        title: 'Direct Sync Failed',
        description: error.message || 'Failed to sync templates directly from Meta',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex space-x-2">
        <Button
          onClick={handleCompare}
          disabled={isComparing || isSyncing}
          size="sm"
          variant="outline"
        >
          {isComparing ? (
            <>
              <span className="animate-spin mr-2">🔍</span>
              Comparing...
            </>
          ) : (
            <>
              <span className="mr-2">🔍</span>
              Compare Status
            </>
          )}
        </Button>

        <Button
          onClick={handleDirectSync}
          disabled={isSyncing || isComparing}
          size="sm"
          variant="destructive"
        >
          {isSyncing ? (
            <>
              <span className="animate-spin mr-2">🚨</span>
              Force Syncing...
            </>
          ) : (
            <>
              <span className="mr-2">🚨</span>
              Emergency Sync
            </>
          )}
        </Button>
      </div>

      {comparisonResult && (
        <div className="text-sm bg-yellow-50 border border-yellow-200 rounded p-3">
          <div className="font-medium text-yellow-800">Template Status Comparison:</div>
          <div className="text-yellow-700 mt-1">
            • {comparisonResult.summary.total} total templates
            • {comparisonResult.summary.matching} matching status
            • {comparisonResult.summary.needingUpdate} need updates
            • {comparisonResult.summary.missingInDb} missing in database
          </div>
          
          {comparisonResult.summary.needingUpdate > 0 && (
            <div className="mt-2">
              <div className="font-medium text-red-700">Templates needing sync:</div>
              {comparisonResult.comparisons
                .filter((c: any) => c.needsUpdate)
                .slice(0, 3)
                .map((c: any) => (
                  <div key={`${c.name}-${c.language}`} className="text-red-600 text-xs">
                    • {c.name} ({c.language}): DB={c.database?.status || 'missing'} → Meta={c.meta?.status}
                  </div>
                ))}
              {comparisonResult.comparisons.filter((c: any) => c.needsUpdate).length > 3 && (
                <div className="text-red-600 text-xs">
                  ... and {comparisonResult.comparisons.filter((c: any) => c.needsUpdate).length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Usage instructions component
export function DirectSyncInstructions() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
      <div className="font-medium text-blue-800 mb-2">🚨 Template Status Sync Issues?</div>
      <div className="text-blue-700 space-y-1">
        <div>1. <strong>Compare Status</strong> - Check differences between your database and Meta</div>
        <div>2. <strong>Emergency Sync</strong> - Force sync all templates directly from Meta (bypasses webhooks)</div>
        <div>3. This will immediately update template statuses and refresh the UI</div>
      </div>
    </div>
  );
}