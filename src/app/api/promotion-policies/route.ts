import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { PromotionPolicy, PromotionBuyItem, PromotionGetItem } from "@/lib/db/entities";
import {
    getAuthUser,
    requirePermission,
    successResponse,
    badRequestResponse,
    errorResponse,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "promotion_policy", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const repo = db.getRepository(PromotionPolicy);

        const policies = await repo.find({
            where: { deleted: false },
            relations: ["buyItems", "buyItems.product", "getItems", "getItems.product"],
            order: { createdAt: "DESC" },
        });

        return successResponse(policies);
    } catch (error) {
        console.error("Get promotion policies error:", error);
        return errorResponse("An error occurred while fetching promotion policies");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "promotion_policy", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const {
            name,
            startDate,
            endDate,
            isActive = true,
            buyItems = [],
            getItems = []
        } = body;

        if (!name || !startDate || !endDate) {
            return badRequestResponse("Name, startDate and endDate are required");
        }

        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const policyRepo = manager.getRepository(PromotionPolicy);
            const buyRepo = manager.getRepository(PromotionBuyItem);
            const getRepo = manager.getRepository(PromotionGetItem);

            const policy = policyRepo.create({
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive,
                createdBy: authUser?.username || "system",
                modifiedBy: authUser?.username || "system",
            });

            await policyRepo.save(policy);

            for (const item of buyItems) {
                const buyItem = buyRepo.create({
                    promotionId: policy.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    createdBy: authUser?.username || "system",
                    modifiedBy: authUser?.username || "system",
                });
                await buyRepo.save(buyItem);
            }

            for (const item of getItems) {
                const getItem = getRepo.create({
                    promotionId: policy.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    discountPercentage: item.discountPercentage || 100,
                    createdBy: authUser?.username || "system",
                    modifiedBy: authUser?.username || "system",
                });
                await getRepo.save(getItem);
            }

            return successResponse(policy, "Promotion policy created successfully");
        });
    } catch (error) {
        console.error("Create promotion policy error:", error);
        return errorResponse("An error occurred while creating promotion policy");
    }
}
