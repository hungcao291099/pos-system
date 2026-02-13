import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, badRequestResponse } from "@/lib/api-utils";
import { TableOrderService } from "@/lib/services/TableOrderService";
import { emitEvent } from "@/lib/socketServer";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return errorResponse("Unauthorized", 401);

        const searchParams = request.nextUrl.searchParams;
        const tableId = searchParams.get("tableId");
        const active = searchParams.get("active");

        let orders;
        if (active === "true") {
            orders = await TableOrderService.getActiveOrders();
        } else if (tableId) {
            orders = await TableOrderService.getOrdersByTable(parseInt(tableId));
        } else {
            orders = await TableOrderService.getActiveOrders();
        }

        return successResponse(orders);
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return errorResponse("Unauthorized", 401);

        const body = await request.json();
        if (!body.tableId || !body.items || body.items.length === 0) {
            return badRequestResponse("Thiếu thông tin bàn hoặc danh sách món");
        }

        const order = await TableOrderService.createOrder(body, user.userId.toString());

        // Emit real-time event
        emitEvent("order:new", order);
        emitEvent("table:update", { tableId: body.tableId, status: "occupied" });

        return successResponse(order, "Tạo đơn thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
