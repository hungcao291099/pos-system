import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { PriceHistory } from "@/lib/db/entities";
import {
    getAuthUser,
    requirePermission,
    successResponse,
    errorResponse,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "price-history", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const repo = db.getRepository(PriceHistory);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "20");
        const productId = searchParams.get("productId");
        const warehouseId = searchParams.get("warehouseId");
        const priceType = searchParams.get("priceType");

        const queryBuilder = repo
            .createQueryBuilder("history")
            .leftJoinAndSelect("history.product", "product")
            .leftJoinAndSelect("history.warehouse", "warehouse")
            .where("history.deleted = :deleted", { deleted: false });

        if (productId) {
            queryBuilder.andWhere("history.productId = :productId", { productId: parseInt(productId) });
        }

        if (warehouseId) {
            queryBuilder.andWhere("history.warehouseId = :warehouseId", { warehouseId: parseInt(warehouseId) });
        }

        if (priceType) {
            queryBuilder.andWhere("history.priceType = :priceType", { priceType });
        }

        const [items, total] = await queryBuilder
            .orderBy("history.effectiveDate", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        return successResponse({
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error("Get price history error:", error);
        return errorResponse("An error occurred while fetching price history");
    }
}
