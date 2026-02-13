import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, badRequestResponse } from "@/lib/api-utils";
import { TableService } from "@/lib/services/TableService";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return errorResponse("Unauthorized", 401);

        const areas = await TableService.listAreas();
        return successResponse(areas);
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return errorResponse("Unauthorized", 401);

        const body = await request.json();
        const { oldName, newName, action } = body;

        if (action === "rename") {
            if (!oldName || !newName) {
                return badRequestResponse("Tên cũ và tên mới là bắt buộc");
            }
            await TableService.renameArea(oldName, newName, user.userId.toString());
            return successResponse(null, "Cập nhật khu vực thành công");
        }

        return badRequestResponse("Hành động không hợp lệ");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
