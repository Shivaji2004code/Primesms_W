import winston from 'winston';
declare const logger: winston.Logger;
export declare const createHttpLogger: () => (req: any, res: any, next: any) => void;
export declare const logInfo: (message: string, meta?: any) => void;
export declare const logError: (message: string, error?: Error | any, meta?: any) => void;
export declare const logWarn: (message: string, meta?: any) => void;
export declare const logDebug: (message: string, meta?: any) => void;
export declare const logDatabase: (operation: string, query?: string, duration?: number, error?: Error) => void;
export declare const logSecurity: (event: string, details: any, severity?: "info" | "warn" | "error") => void;
export declare const logStartup: (message: string, config?: any) => void;
export declare const logShutdown: (message: string, reason?: string) => void;
export { logger };
export default logger;
//# sourceMappingURL=logger.d.ts.map