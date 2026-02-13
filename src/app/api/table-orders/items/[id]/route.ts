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

        if (!body.status) {
            return badRequestResponse("Trạng thái không hợp lệ");
        }

        const validStatuses = ["pending", "preparing", "done"];
        if (!validStatuses.includes(body.status)) {
            return badRequestResponse("Trạng thái không hợp lệ");
        }

        const item = await TableOrderService.updateItemStatus(
            parseInt(id),
            body.status,
            user.userId.toString()
        );

        emitEvent("order:itemUpdate", item);

        return successResponse(item, "Cập nhật trạng thái thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
