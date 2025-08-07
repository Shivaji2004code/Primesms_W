import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to detect and block duplicate messages
 */
export declare const duplicateDetectionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Helper function to check if request is marked as duplicate
 */
export declare const isDuplicateRequest: (req: Request) => boolean;
/**
 * Helper function to get duplicate response
 */
export declare const getDuplicateResponse: (res: Response) => any;
/**
 * Check if a specific message is a duplicate and handle it
 * This is the main function to use in message sending loops
 */
export declare const checkAndHandleDuplicate: (userId: string, templateName: string, phone: string, variables: any, campaignId?: string) => Promise<{
    isDuplicate: boolean;
    hash: string;
}>;
/**
 * Get cache statistics for monitoring
 */
export declare const getDuplicateCacheStats: () => {
    totalCachedMessages: number;
    cacheHits: number;
    cacheMisses: number;
    cacheKeys: string[];
};
//# sourceMappingURL=duplicateDetection.d.ts.map