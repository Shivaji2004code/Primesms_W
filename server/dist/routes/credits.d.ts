declare const router: import("express-serve-static-core").Router;
export declare const deductCredits: (userId: string, amount: number, description: string) => Promise<{
    success: boolean;
    newBalance: number;
}>;
export default router;
//# sourceMappingURL=credits.d.ts.map