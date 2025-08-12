declare const router: import("express-serve-static-core").Router;
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                username: string;
                role: string;
            };
            bulkJob?: any;
        }
    }
}
export default router;
//# sourceMappingURL=bulk.d.ts.map