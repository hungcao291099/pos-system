import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Unit } from "@/lib/db/entities";
import {
    getAuthUser,
    requirePermission,
    successResponse,
    badRequestResponse,
    errorResponse,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "unit", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const repo = db.getRepository(Unit);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const all = searchParams.get("all") === "true";

        const queryBuilder = repo
            .createQueryBuilder("unit")
            .where("unit.deleted = :deleted", { deleted: false });

        if (search) {
            queryBuilder.andWhere(
                "(unit.code LIKE :search OR unit.name LIKE :search)",
                { search: `%${search}%` }
            );
        }

        if (all) {
            const items = await queryBuilder
                .orderBy("unit.name", "ASC")
                .getMany();
            return successResponse(items);
        }

        const [items, total] = await queryBuilder
            .orderBy("unit.created_at", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        return successResponse({
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error("Get units error:", error);
        return errorResponse("An error occurred while fetching units");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "unit", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const { code, name, description, isActive = true } = body;

        if (!code || !name) {
            return badRequestResponse("Code and name are required");
        }

        const db = await initializeDatabase();
        const repo = db.getRepository(Unit);

        // Check if code already exists
        const existing = await repo.findOne({
            where: { code, deleted: false },
        });
        if (existing) {
            return badRequestResponse("Unit code already exists");
        }

        const unit = repo.create({
            code,
            name,
            description,
            isActive,
            createdBy: authUser?.username || "system",
            modifiedBy: authUser?.username || "system",
        });

        await repo.save(unit);

        return successResponse(unit, "Unit created successfully");
    } catch (error) {
        console.error("Create unit error:", error);
        return errorResponse("An error occurred while creating unit");
    }
}
