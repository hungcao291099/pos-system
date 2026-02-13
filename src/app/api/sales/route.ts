import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, requirePermission, badRequestResponse } from "@/lib/api-utils";
import { SalesService } from "@/lib/services/SalesService";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "sales", "read");
        if (permCheck) return permCheck;

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "20");
        const warehouseId = searchParams.get("warehouseId");
        const customerId = searchParams.get("customerId");
        const paymentMethod = searchParams.get("paymentMethod") as "cash" | "transfer" | "credit" | null;
        const search = searchParams.get("search");

        const result = await SalesService.listInvoices(
            {
                warehouseId: warehouseId ? parseInt(warehouseId) : undefined,
                customerId: customerId ? parseInt(customerId) : undefined,
                paymentMethod: paymentMethod || undefined,
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
        const permCheck = requirePermission(user, "sales", "create");
        if (permCheck) return permCheck;

        const body = await request.json();

        if (!body.warehouseId || !body.paymentMethod || !body.items || body.items.length === 0) {
            return badRequestResponse("Thiếu thông tin kho, hình thức thanh toán hoặc chi tiết");
        }

        const invoice = await SalesService.createSale(body, user!.userId.toString());

        return successResponse(invoice, "Tạo hóa đơn thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
