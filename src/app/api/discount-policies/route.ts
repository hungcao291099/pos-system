import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { DiscountPolicy } from "@/lib/db/entities";
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
        const permissionCheck = requirePermission(user, "discount_policy", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const repo = db.getRepository(DiscountPolicy);

        const policies = await repo.find({
            where: { deleted: false },
            relations: ["category"],
            order: { createdAt: "DESC" },
        });

        return successResponse(policies);
    } catch (error) {
        console.error("Get discount policies error:", error);
        return errorResponse("An error occurred while fetching discount policies");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "discount_policy", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const {
            name,
            startDate,
            endDate,
            categoryId,
            discountPercentage,
            applyToAll,
            isActive = true
        } = body;

        if (!name || !startDate || !endDate || discountPercentage === undefined) {
            return badRequestResponse("Name, startDate, endDate and discountPercentage are required");
        }

        const db = await initializeDatabase();
        const repo = db.getRepository(DiscountPolicy);

        const policy = repo.create({
            name,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            categoryId,
            discountPercentage,
            applyToAll,
            isActive,
            createdBy: authUser?.username || "system",
            modifiedBy: authUser?.username || "system",
        });

        await repo.save(policy);
        return successResponse(policy, "Discount policy created successfully");
    } catch (error) {
        console.error("Create discount policy error:", error);
        return errorResponse("An error occurred while creating discount policy");
    }
}
