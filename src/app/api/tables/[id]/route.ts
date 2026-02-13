import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, badRequestResponse } from "@/lib/api-utils";
import { TableService } from "@/lib/services/TableService";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        if (!user) return errorResponse("Unauthorized", 401);

        const { id } = await params;
        const body = await request.json();

        if (body.action === "delete") {
            await TableService.deleteTable(parseInt(id), user.userId.toString());
            return successResponse(null, "Xóa bàn thành công");
        }

        const table = await TableService.updateTable(
            parseInt(id),
            body,
            user.userId.toString()
        );
        return successResponse(table, "Cập nhật bàn thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
