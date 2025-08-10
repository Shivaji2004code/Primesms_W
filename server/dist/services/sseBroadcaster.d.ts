import { Response, Request } from 'express';
type AnyObj = Record<string, any>;
export declare class SSEHub {
    private reports;
    private templates;
    private connectionCount;
    attachReports(req: Request, res: Response, userId: string): void;
    attachTemplates(req: Request, res: Response, userId: string): void;
    emitReport(userId: string, payload: AnyObj): void;
    emitTemplate(userId: string, payload: AnyObj): void;
    private attach;
    private emit;
    private cleanup;
    getTotalConnections(): number;
    getConnectionStats(): {
        reports: number;
        templates: number;
        total: number;
    };
    hasConnectionsForUser(userId: string): boolean;
    sendTestEvent(userId: string, eventType: 'reports' | 'templates'): boolean;
    broadcastToAll(payload: AnyObj, eventType?: 'reports' | 'templates'): void;
}
export declare const sseHub: SSEHub;
export {};
//# sourceMappingURL=sseBroadcaster.d.ts.map