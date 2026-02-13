import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, requirePermission, notFoundResponse } from "@/lib/api-utils";
import { SalesService } from "@/lib/services/SalesService";

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: Params) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "sales", "read");
        if (permCheck) return permCheck;

        const { id } = await context.params;
        const invoice = await SalesService.getInvoiceWithDetails(parseInt(id));

        if (!invoice) {
            return notFoundResponse("Hóa đơn không tồn tại");
        }

        return successResponse(invoice);
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}

export async function DELETE(request: NextRequest, context: Params) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "sales", "delete");
        if (permCheck) return permCheck;

        const { id } = await context.params;
        const invoice = await SalesService.cancelSale(
            parseInt(id),
            user!.userId.toString()
        );

        return successResponse(invoice, "Hủy hóa đơn thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
