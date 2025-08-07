export declare const CREDIT_RATES: {
    readonly MARKETING: 0.8;
    readonly UTILITY: 0.15;
    readonly AUTHENTICATION: 0.15;
};
export type TemplateCategory = keyof typeof CREDIT_RATES;
export declare enum CreditTransactionType {
    DEDUCTION_QUICKSEND = "DEDUCTION_QUICKSEND",
    DEDUCTION_CUSTOMISE_SMS = "DEDUCTION_CUSTOMISE_SMS",
    DEDUCTION_API_DELIVERED = "DEDUCTION_API_DELIVERED",
    DEDUCTION_DUPLICATE_BLOCKED = "DEDUCTION_DUPLICATE_BLOCKED",
    ADMIN_ADD = "ADMIN_ADD",
    ADMIN_DEDUCT = "ADMIN_DEDUCT",
    REFUND = "REFUND"
}
interface CreditTransaction {
    userId: string;
    amount: number;
    transactionType: CreditTransactionType;
    templateCategory?: TemplateCategory;
    templateName?: string;
    messageId?: string;
    campaignId?: string;
    description?: string;
}
/**
 * Get the credit rate for a template category
 */
export declare function getCreditRate(category: TemplateCategory): number;
/**
 * Check if user has sufficient credit balance
 */
export declare function checkSufficientCredits(userId: string, requiredAmount: number): Promise<{
    sufficient: boolean;
    currentBalance: number;
}>;
/**
 * Deduct credits from user account with transaction logging
 */
export declare function deductCredits(transaction: CreditTransaction): Promise<{
    success: boolean;
    newBalance: number;
    transactionId?: string;
}>;
/**
 * Add credits to user account (for admin use)
 */
export declare function addCredits(transaction: CreditTransaction): Promise<{
    success: boolean;
    newBalance: number;
    transactionId?: string;
}>;
/**
 * Get template category from template name
 */
export declare function getTemplateCategory(userId: string, templateName: string): Promise<TemplateCategory | null>;
/**
 * Calculate credit cost for sending messages using a template
 */
export declare function calculateCreditCost(userId: string, templateName: string, messageCount?: number): Promise<{
    cost: number;
    category: TemplateCategory;
}>;
/**
 * Pre-check credits for bulk operations
 */
export declare function preCheckCreditsForBulk(userId: string, templateName: string, messageCount: number): Promise<{
    sufficient: boolean;
    requiredCredits: number;
    currentBalance: number;
    category: TemplateCategory;
}>;
export {};
//# sourceMappingURL=creditSystem.d.ts.map