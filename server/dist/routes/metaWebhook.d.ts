declare global {
    namespace Express {
        interface Request {
            rawBody?: Buffer;
        }
    }
}
declare const metaWebhookRouter: import("express-serve-static-core").Router;
export default metaWebhookRouter;
//# sourceMappingURL=metaWebhook.d.ts.map