import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, requirePermission, notFoundResponse } from "@/lib/api-utils";
import { GoodsReceiptService } from "@/lib/services/GoodsReceiptService";

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: Params) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "goods-receipt", "read");
        if (permCheck) return permCheck;

        const { id } = await context.params;
        const receipt = await GoodsReceiptService.getReceiptWithDetails(parseInt(id));

        if (!receipt) {
            return notFoundResponse("Phiếu nhập không tồn tại");
        }

        return successResponse(receipt);
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}

export async function DELETE(request: NextRequest, context: Params) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "goods-receipt", "delete");
        if (permCheck) return permCheck;

        const { id } = await context.params;
        const receipt = await GoodsReceiptService.cancelReceipt(
            parseInt(id),
            user!.userId.toString()
        );

        return successResponse(receipt, "Hủy phiếu nhập thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
