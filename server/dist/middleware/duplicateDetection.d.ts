import { Request, Response, NextFunction } from 'express';
export declare const duplicateDetectionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const isDuplicateRequest: (req: Request) => boolean;
export declare const getDuplicateResponse: (res: Response) => any;
export declare const checkAndHandleDuplicate: (userId: string, templateName: string, phone: string, variables: any, campaignId?: string) => Promise<{
    isDuplicate: boolean;
    hash: string;
}>;
export declare const getDuplicateCacheStats: () => {
    totalCachedMessages: number;
    cacheHits: number;
    cacheMisses: number;
    cacheKeys: string[];
};
//# sourceMappingURL=duplicateDetection.d.ts.map