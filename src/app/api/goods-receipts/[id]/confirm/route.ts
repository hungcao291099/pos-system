import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, requirePermission } from "@/lib/api-utils";
import { GoodsReceiptService } from "@/lib/services/GoodsReceiptService";

interface Params {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: Params) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "goods-receipt", "update");
        if (permCheck) return permCheck;

        const { id } = await context.params;
        const receipt = await GoodsReceiptService.confirmReceipt(
            parseInt(id),
            user!.userId.toString()
        );

        return successResponse(receipt, "Xác nhận phiếu nhập thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
