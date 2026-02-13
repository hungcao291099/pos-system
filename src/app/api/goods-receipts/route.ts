import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, requirePermission, badRequestResponse } from "@/lib/api-utils";
import { GoodsReceiptService } from "@/lib/services/GoodsReceiptService";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "goods-receipt", "read");
        if (permCheck) return permCheck;

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "20");
        const warehouseId = searchParams.get("warehouseId");
        const supplierId = searchParams.get("supplierId");
        const status = searchParams.get("status") as "draft" | "confirmed" | "cancelled" | null;
        const search = searchParams.get("search");

        const result = await GoodsReceiptService.listReceipts(
            {
                warehouseId: warehouseId ? parseInt(warehouseId) : undefined,
                supplierId: supplierId ? parseInt(supplierId) : undefined,
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
        const permCheck = requirePermission(user, "goods-receipt", "create");
        if (permCheck) return permCheck;

        const body = await request.json();

        if (!body.warehouseId || !body.details || body.details.length === 0) {
            return badRequestResponse("Thiếu thông tin kho nhập hoặc chi tiết");
        }

        const receipt = await GoodsReceiptService.createReceipt(
            {
                ...body,
                receiptDate: body.receiptDate ? new Date(body.receiptDate) : new Date(),
                invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
            },
            user!.userId.toString()
        );

        return successResponse(receipt, "Tạo phiếu nhập thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
