import { sseHub } from '../services/sseBroadcaster';
declare const sseRouter: import("express-serve-static-core").Router;
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                username: string;
                role: string;
            };
        }
    }
}
export default sseRouter;
export { sseHub };
//# sourceMappingURL=sseRoutes.d.ts.map