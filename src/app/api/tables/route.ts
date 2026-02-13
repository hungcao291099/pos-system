import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, badRequestResponse, requirePermission } from "@/lib/api-utils";
import { TableService } from "@/lib/services/TableService";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return errorResponse("Unauthorized", 401);

        const tables = await TableService.listTables();
        return successResponse(tables);
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return errorResponse("Unauthorized", 401);

        const body = await request.json();
        if (!body.name) {
            return badRequestResponse("Tên bàn là bắt buộc");
        }

        const table = await TableService.createTable(body, user.userId.toString());
        return successResponse(table, "Tạo bàn thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
