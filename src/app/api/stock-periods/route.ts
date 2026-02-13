import { NextRequest } from "next/server";
import { getAuthUser, successResponse, errorResponse, requirePermission, badRequestResponse } from "@/lib/api-utils";
import { StockBalanceService } from "@/lib/services/StockBalanceService";
import { initializeDatabase } from "@/lib/db/data-source";
import { StockPeriod } from "@/lib/db/entities";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "inventory", "read");
        if (permCheck) return permCheck;

        const searchParams = request.nextUrl.searchParams;
        const warehouseId = searchParams.get("warehouseId");

        const db = await initializeDatabase();
        const periodRepo = db.getRepository(StockPeriod);

        let qb = periodRepo
            .createQueryBuilder("p")
            .leftJoinAndSelect("p.warehouse", "warehouse")
            .orderBy("p.periodCode", "DESC");

        if (warehouseId) {
            qb = qb.andWhere("p.warehouseId = :warehouseId", { warehouseId: parseInt(warehouseId) });
        }

        const periods = await qb.getMany();
        return successResponse(periods);
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permCheck = requirePermission(user, "inventory", "update");
        if (permCheck) return permCheck;

        const body = await request.json();
        const { warehouseId, periodCode } = body;

        if (!warehouseId || !periodCode) {
            return badRequestResponse("Thiếu thông tin kho hoặc kỳ");
        }

        const nextPeriod = await StockBalanceService.closePeriod(
            parseInt(warehouseId),
            periodCode,
            user!.userId.toString()
        );

        return successResponse(nextPeriod, "Chốt kỳ thành công");
    } catch (error) {
        return errorResponse((error as Error).message);
    }
}
