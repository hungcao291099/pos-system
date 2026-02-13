import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, badRequestResponse } from "@/lib/api-utils";
import { TableService } from "@/lib/services/TableService";

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return errorResponse("Unauthorized", 401);

        const body = await request.json();
        if (!body.positions || !Array.isArray(body.positions)) {
            return badRequestResponse("Dữ liệu vị trí không hợp lệ");
        }

        await TableService.updateLayout(body.positions, user.userId.toString());
        return successResponse(null, "Cập nhật layout thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
