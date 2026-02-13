import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, requirePermission, badRequestResponse } from "@/lib/api-utils";
import { SalesService } from "@/lib/services/SalesService";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "sales", "read");
        if (permCheck) return permCheck;

        const searchParams = request.nextUrl.searchParams;
        const warehouseId = searchParams.get("warehouseId");

        if (!warehouseId) {
            return badRequestResponse("Thiếu thông tin kho");
        }

        const products = await SalesService.getProductsForSale(parseInt(warehouseId));

        return successResponse(products);
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
