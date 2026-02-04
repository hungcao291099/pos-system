import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Warehouse } from "@/lib/db/entities";
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
        const permissionCheck = requirePermission(user, "warehouse", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const repo = db.getRepository(Warehouse);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const all = searchParams.get("all") === "true";

        const queryBuilder = repo
            .createQueryBuilder("warehouse")
            .where("warehouse.deleted = :deleted", { deleted: false });

        if (search) {
            queryBuilder.andWhere(
                "(warehouse.code LIKE :search OR warehouse.name LIKE :search)",
                { search: `%${search}%` }
            );
        }

        if (all) {
            const items = await queryBuilder
                .orderBy("warehouse.name", "ASC")
                .getMany();
            return successResponse(items);
        }

        const [items, total] = await queryBuilder
            .orderBy("warehouse.created_at", "DESC")
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
        console.error("Get warehouses error:", error);
        return errorResponse("An error occurred while fetching warehouses");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "warehouse", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const { code, name, address, description, isActive = true } = body;

        if (!code || !name) {
            return badRequestResponse("Code and name are required");
        }

        const db = await initializeDatabase();
        const repo = db.getRepository(Warehouse);

        // Check if code already exists
        const existing = await repo.findOne({
            where: { code, deleted: false },
        });
        if (existing) {
            return badRequestResponse("Warehouse code already exists");
        }

        const warehouse = repo.create({
            code,
            name,
            address,
            description,
            isActive,
            createdBy: authUser?.username || "system",
            modifiedBy: authUser?.username || "system",
        });

        await repo.save(warehouse);

        return successResponse(warehouse, "Warehouse created successfully");
    } catch (error) {
        console.error("Create warehouse error:", error);
        return errorResponse("An error occurred while creating warehouse");
    }
}
