import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, requirePermission } from "@/lib/api-utils";
import { StockOutService } from "@/lib/services/StockOutService";

interface Params {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: Params) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "stock-out", "update");
        if (permCheck) return permCheck;

        const { id } = await context.params;
        const stockOut = await StockOutService.confirmStockOut(
            parseInt(id),
            user!.userId.toString()
        );

        return successResponse(stockOut, "Xác nhận phiếu xuất thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
