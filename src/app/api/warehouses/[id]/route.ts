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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "warehouse", "read");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(Warehouse);

        const warehouse = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!warehouse) {
            return badRequestResponse("Warehouse not found");
        }

        return successResponse(warehouse);
    } catch (error) {
        console.error("Get warehouse error:", error);
        return errorResponse("An error occurred while fetching warehouse");
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "warehouse", "update");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const body = await request.json();
        const { name, address, description, isActive } = body;

        const db = await initializeDatabase();
        const repo = db.getRepository(Warehouse);

        const warehouse = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!warehouse) {
            return badRequestResponse("Warehouse not found");
        }

        if (name !== undefined) warehouse.name = name;
        if (address !== undefined) warehouse.address = address;
        if (description !== undefined) warehouse.description = description;
        if (isActive !== undefined) warehouse.isActive = isActive;
        warehouse.modifiedBy = authUser?.username || "system";

        await repo.save(warehouse);

        return successResponse(warehouse, "Warehouse updated successfully");
    } catch (error) {
        console.error("Update warehouse error:", error);
        return errorResponse("An error occurred while updating warehouse");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "warehouse", "delete");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(Warehouse);

        const warehouse = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!warehouse) {
            return badRequestResponse("Warehouse not found");
        }

        warehouse.deleted = true;
        warehouse.deletedAt = new Date();
        warehouse.deletedBy = authUser?.username || "system";

        await repo.save(warehouse);

        return successResponse(null, "Warehouse deleted successfully");
    } catch (error) {
        console.error("Delete warehouse error:", error);
        return errorResponse("An error occurred while deleting warehouse");
    }
}
