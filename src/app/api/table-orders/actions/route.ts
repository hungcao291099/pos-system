import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, badRequestResponse } from "@/lib/api-utils";
import { TableOrderService } from "@/lib/services/TableOrderService";
import { emitEvent } from "@/lib/socketServer";

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return errorResponse("Unauthorized", 401);

        const body = await request.json();
        const { action, ...payload } = body;
        const userId = user.userId.toString();

        switch (action) {
            case "merge": {
                const { sourceOrderId, targetOrderId } = payload;
                if (!sourceOrderId || !targetOrderId) return badRequestResponse("Thiếu ID đơn hàng");
                const order = await TableOrderService.mergeOrders(sourceOrderId, targetOrderId, userId);
                emitEvent("order:update", order);
                emitEvent("table:update", { tableId: order.tableId, status: "occupied" });
                return successResponse(order, "Gộp bàn thành công");
            }
            case "move": {
                const { orderId, targetTableId } = payload;
                if (!orderId || !targetTableId) return badRequestResponse("Thiếu thông tin bàn");
                const order = await TableOrderService.moveOrder(orderId, targetTableId, userId);
                emitEvent("order:update", order);
                emitEvent("table:update", { tableId: targetTableId, status: "occupied" });
                return successResponse(order, "Chuyển bàn thành công");
            }
            case "split": {
                const { sourceOrderId, targetTableId, items } = payload;
                if (!sourceOrderId || !targetTableId || !items) return badRequestResponse("Thiếu thông tin tách đơn");
                const order = await TableOrderService.splitOrder(sourceOrderId, targetTableId, items, userId);
                emitEvent("order:update", order);
                emitEvent("table:update", { tableId: targetTableId, status: "occupied" });
                return successResponse(order, "Tách đơn thành công");
            }
            default:
                return badRequestResponse("Hành động không hợp lệ");
        }
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
