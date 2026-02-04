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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "unit", "read");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(Unit);

        const unit = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!unit) {
            return badRequestResponse("Unit not found");
        }

        return successResponse(unit);
    } catch (error) {
        console.error("Get unit error:", error);
        return errorResponse("An error occurred while fetching unit");
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "unit", "update");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const body = await request.json();
        const { name, description, isActive } = body;

        const db = await initializeDatabase();
        const repo = db.getRepository(Unit);

        const unit = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!unit) {
            return badRequestResponse("Unit not found");
        }

        if (name !== undefined) unit.name = name;
        if (description !== undefined) unit.description = description;
        if (isActive !== undefined) unit.isActive = isActive;
        unit.modifiedBy = authUser?.username || "system";

        await repo.save(unit);

        return successResponse(unit, "Unit updated successfully");
    } catch (error) {
        console.error("Update unit error:", error);
        return errorResponse("An error occurred while updating unit");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "unit", "delete");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(Unit);

        const unit = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!unit) {
            return badRequestResponse("Unit not found");
        }

        unit.deleted = true;
        unit.deletedAt = new Date();
        unit.deletedBy = authUser?.username || "system";

        await repo.save(unit);

        return successResponse(null, "Unit deleted successfully");
    } catch (error) {
        console.error("Delete unit error:", error);
        return errorResponse("An error occurred while deleting unit");
    }
}
