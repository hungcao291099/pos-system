import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, requirePermission, badRequestResponse } from "@/lib/api-utils";
import { StockBalanceService } from "@/lib/services/StockBalanceService";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "inventory", "read");
        if (permCheck) return permCheck;

        const searchParams = request.nextUrl.searchParams;
        const warehouseId = searchParams.get("warehouseId");
        const periodCode = searchParams.get("periodCode");

        if (!warehouseId) {
            return badRequestResponse("Thiếu thông tin kho");
        }

        const balances = await StockBalanceService.getStockByWarehouse(
            parseInt(warehouseId),
            periodCode || undefined
        );

        return successResponse(balances);
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "inventory", "update");
        if (permCheck) return permCheck;

        const body = await request.json();
        const { action, warehouseId, periodCode } = body;

        if (!warehouseId || !periodCode) {
            return badRequestResponse("Thiếu thông tin kho hoặc kỳ");
        }

        if (action === "recalculate") {
            await StockBalanceService.recalculateStock(parseInt(warehouseId), periodCode);
            return successResponse(null, "Tính lại tồn kho thành công");
        }

        return badRequestResponse("Hành động không hợp lệ");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
