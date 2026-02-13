import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, requirePermission, notFoundResponse } from "@/lib/api-utils";
import { StockOutService } from "@/lib/services/StockOutService";

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: Params) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "stock-out", "read");
        if (permCheck) return permCheck;

        const { id } = await context.params;
        const stockOut = await StockOutService.getStockOutWithDetails(parseInt(id));

        if (!stockOut) {
            return notFoundResponse("Phiếu xuất không tồn tại");
        }

        return successResponse(stockOut);
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}

export async function DELETE(request: NextRequest, context: Params) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "stock-out", "delete");
        if (permCheck) return permCheck;

        const { id } = await context.params;
        const stockOut = await StockOutService.cancelStockOut(
            parseInt(id),
            user!.userId.toString()
        );

        return successResponse(stockOut, "Hủy phiếu xuất thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
