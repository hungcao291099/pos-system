import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Permission } from "@/lib/db/entities";
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
        const permissionCheck = requirePermission(user, "permission", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const permissionRepo = db.getRepository(Permission);

        const { searchParams } = new URL(request.url);
        const all = searchParams.get("all") === "true";
        const resource = searchParams.get("resource");

        const queryBuilder = permissionRepo
            .createQueryBuilder("permission")
            .where("permission.deleted = :deleted", { deleted: false });

        if (resource) {
            queryBuilder.andWhere("permission.resource = :resource", { resource });
        }

        const permissions = await queryBuilder
            .orderBy("permission.resource", "ASC")
            .addOrderBy("permission.action", "ASC")
            .getMany();

        if (all) {
            return successResponse(
                permissions.map((p) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    resource: p.resource,
                    action: p.action,
                }))
            );
        }

        // Group by resource
        const grouped = permissions.reduce((acc: any, p) => {
            if (!acc[p.resource]) {
                acc[p.resource] = [];
            }
            acc[p.resource].push({
                id: p.id,
                name: p.name,
                description: p.description,
                action: p.action,
            });
            return acc;
        }, {});

        return successResponse(grouped);
    } catch (error) {
        console.error("Get permissions error:", error);
        return errorResponse("An error occurred while fetching permissions");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "permission", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const { name, description, resource, action } = body;

        if (!name || !resource || !action) {
            return badRequestResponse("Permission name, resource, and action are required");
        }

        const db = await initializeDatabase();
        const permissionRepo = db.getRepository(Permission);

        const existingPermission = await permissionRepo.findOne({
            where: { name, deleted: false },
        });
        if (existingPermission) {
            return badRequestResponse("Permission name already exists");
        }

        const permission = permissionRepo.create({
            name,
            description,
            resource,
            action,
            createdBy: authUser?.username || "system",
            modifiedBy: authUser?.username || "system",
        });

        await permissionRepo.save(permission);

        return successResponse(
            {
                id: permission.id,
                name: permission.name,
                description: permission.description,
                resource: permission.resource,
                action: permission.action,
            },
            "Permission created successfully"
        );
    } catch (error) {
        console.error("Create permission error:", error);
        return errorResponse("An error occurred while creating permission");
    }
}
