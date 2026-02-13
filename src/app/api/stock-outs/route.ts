import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, requirePermission, badRequestResponse } from "@/lib/api-utils";
import { StockOutService } from "@/lib/services/StockOutService";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "stock-out", "read");
        if (permCheck) return permCheck;

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "20");
        const fromWarehouseId = searchParams.get("fromWarehouseId");
        const outType = searchParams.get("outType") as "return" | "transfer" | "adjustment" | null;
        const status = searchParams.get("status") as "draft" | "confirmed" | "cancelled" | null;
        const search = searchParams.get("search");

        const result = await StockOutService.listStockOuts(
            {
                fromWarehouseId: fromWarehouseId ? parseInt(fromWarehouseId) : undefined,
                outType: outType || undefined,
                status: status || undefined,
                search: search || undefined,
            },
            page,
            pageSize
        );

        return successResponse(result);
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "stock-out", "create");
        if (permCheck) return permCheck;

        const body = await request.json();

        if (!body.fromWarehouseId || !body.outType || !body.details || body.details.length === 0) {
            return badRequestResponse("Thiếu thông tin kho xuất, loại phiếu xuất hoặc chi tiết");
        }

        const stockOut = await StockOutService.createStockOut(
            {
                ...body,
                outDate: body.outDate ? new Date(body.outDate) : new Date(),
            },
            user!.userId.toString()
        );

        return successResponse(stockOut, "Tạo phiếu xuất thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
