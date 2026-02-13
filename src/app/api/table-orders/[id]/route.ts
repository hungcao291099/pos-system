import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, badRequestResponse } from "@/lib/api-utils";
import { TableOrderService } from "@/lib/services/TableOrderService";
import { emitEvent } from "@/lib/socketServer";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        if (!user) return errorResponse("Unauthorized", 401);

        const { id } = await params;
        const body = await request.json();

        if (body.action === "complete") {
            const { action, ...paymentDetails } = body;
            const order = await TableOrderService.completeOrder(
                parseInt(id),
                paymentDetails,
                user.userId.toString()
            );
            emitEvent("order:complete", order);
            emitEvent("table:update", { tableId: order.tableId, status: "empty" });
            return successResponse(order, "Đã hoàn thành đơn");
        }

        if (body.action === "cancel") {
            const order = await TableOrderService.cancelOrder(
                parseInt(id),
                user.userId.toString()
            );
            emitEvent("order:update", order);
            return successResponse(order, "Đã hủy đơn");
        }

        return badRequestResponse("Action không hợp lệ");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
