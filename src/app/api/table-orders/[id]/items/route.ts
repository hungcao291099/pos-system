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

        if (!body.items || body.items.length === 0) {
            return badRequestResponse("Danh sách món trống");
        }

        const order = await TableOrderService.addItems(
            parseInt(id),
            body,
            user.userId.toString()
        );

        emitEvent("order:update", order);

        return successResponse(order, "Thêm món thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
