import { initializeDatabase } from "../db/data-source";
import {
    DiscountPolicy,
    PromotionPolicy,
    PromotionBuyItem,
    PromotionGetItem,
    Product
} from "../db/entities";
import { LessThanOrEqual, MoreThanOrEqual, And } from "typeorm";

export interface AppliedDiscount {
    policyId: number;
    name: string;
    discountPercentage: number;
}

export interface AppliedPromotion {
    policyId: number;
    name: string;
    description: string;
    giftItems: {
        productId: number;
        quantity: number;
        discountPercentage: number;
        productName?: string;
    }[];
}

export class PromotionService {
    /**
     * Get all active discount policies for the current date
     */
    static async getActiveDiscountPolicies(): Promise<DiscountPolicy[]> {
        const db = await initializeDatabase();
        const repo = db.getRepository(DiscountPolicy);
        const now = new Date();

        return await repo.find({
            where: {
                isActive: true,
                deleted: false,
                startDate: LessThanOrEqual(now),
                endDate: MoreThanOrEqual(now),
            },
            relations: ["category"],
        });
    }

    /**
     * Calculate the best discount percentage for a product
     */
    static async getProductDiscount(productId: number, categoryId?: number): Promise<AppliedDiscount | null> {
        const policies = await this.getActiveDiscountPolicies();

        let bestPolicy: DiscountPolicy | null = null;

        for (const policy of policies) {
            if (policy.applyToAll || (categoryId && policy.categoryId === categoryId)) {
                if (!bestPolicy || Number(policy.discountPercentage) > Number(bestPolicy.discountPercentage)) {
                    bestPolicy = policy;
                }
            }
        }

        if (bestPolicy) {
            return {
                policyId: bestPolicy.id,
                name: bestPolicy.name,
                discountPercentage: Number(bestPolicy.discountPercentage),
            };
        }

        return null;
    }

    /**
     * Get all active promotion policies for the current date
     */
    static async getActivePromotionPolicies(): Promise<PromotionPolicy[]> {
        const db = await initializeDatabase();
        const repo = db.getRepository(PromotionPolicy);
        const now = new Date();

        return await repo.find({
            where: {
                isActive: true,
                deleted: false,
                startDate: LessThanOrEqual(now),
                endDate: MoreThanOrEqual(now),
            },
            relations: ["buyItems", "buyItems.product", "getItems", "getItems.product"],
        });
    }

    /**
     * Calculate eligible promotions based on the current items in cart
     */
    static async calculatePromotions(items: { productId: number; quantity: number }[]): Promise<AppliedPromotion[]> {
        const activePromotions = await this.getActivePromotionPolicies();
        const appliedPromotions: AppliedPromotion[] = [];

        for (const promotion of activePromotions) {
            // Check if all buy requirements are met
            let timesMet = Infinity;

            for (const buyItem of promotion.buyItems) {
                const cartItem = items.find(i => i.productId === buyItem.productId);
                if (!cartItem || cartItem.quantity < Number(buyItem.quantity)) {
                    timesMet = 0;
                    break;
                }

                const possibleTimes = Math.floor(cartItem.quantity / Number(buyItem.quantity));
                timesMet = Math.min(timesMet, possibleTimes);
            }

            if (timesMet > 0 && timesMet !== Infinity) {
                appliedPromotions.push({
                    policyId: promotion.id,
                    name: promotion.name,
                    description: `Mua ${promotion.buyItems.map(i => `${i.quantity} ${i.product.name}`).join(', ')}`,
                    giftItems: promotion.getItems.map(gi => ({
                        productId: gi.productId,
                        quantity: Number(gi.quantity) * timesMet,
                        discountPercentage: Number(gi.discountPercentage),
                        productName: gi.product.name
                    }))
                });
            }
        }

        return appliedPromotions;
    }
}
