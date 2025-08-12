import { Request, Response } from 'express';
export declare class BulkSSE {
    private connections;
    private connectionCount;
    attach(req: Request, res: Response, jobId: string): void;
    emit(jobId: string, payload: any): void;
    private cleanup;
    getTotalConnections(): number;
    getConnectionStats(): {
        activeJobs: number;
        totalConnections: number;
        jobs: Record<string, number>;
    };
    hasConnections(jobId: string): boolean;
    sendTestEvent(jobId: string): boolean;
    closeJobConnections(jobId: string): void;
}
export declare const bulkSSE: BulkSSE;
//# sourceMappingURL=bulkSSE.d.ts.map