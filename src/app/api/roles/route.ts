import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Role } from "@/lib/db/entities";
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
        const permissionCheck = requirePermission(user, "role", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const roleRepo = db.getRepository(Role);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const all = searchParams.get("all") === "true";

        const queryBuilder = roleRepo
            .createQueryBuilder("role")
            .where("role.deleted = :deleted", { deleted: false });

        if (search) {
            queryBuilder.andWhere(
                "(role.name LIKE :search OR role.description LIKE :search)",
                { search: `%${search}%` }
            );
        }

        if (all) {
            const roles = await queryBuilder.orderBy("role.name", "ASC").getMany();
            return successResponse(
                roles.map((r) => ({
                    id: r.id,
                    name: r.name,
                    description: r.description,
                    isActive: r.isActive,
                }))
            );
        }

        const [roles, total] = await queryBuilder
            .orderBy("role.created_at", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        return successResponse({
            items: roles.map((r) => ({
                id: r.id,
                name: r.name,
                description: r.description,
                isActive: r.isActive,
                createdAt: r.createdAt,
                modifiedAt: r.modifiedAt,
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error("Get roles error:", error);
        return errorResponse("An error occurred while fetching roles");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "role", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const { name, description, isActive = true } = body;

        if (!name) {
            return badRequestResponse("Role name is required");
        }

        const db = await initializeDatabase();
        const roleRepo = db.getRepository(Role);

        const existingRole = await roleRepo.findOne({
            where: { name, deleted: false },
        });
        if (existingRole) {
            return badRequestResponse("Role name already exists");
        }

        const role = roleRepo.create({
            name,
            description,
            isActive,
            createdBy: authUser?.username || "system",
            modifiedBy: authUser?.username || "system",
        });

        await roleRepo.save(role);

        return successResponse(
            {
                id: role.id,
                name: role.name,
                description: role.description,
                isActive: role.isActive,
            },
            "Role created successfully"
        );
    } catch (error) {
        console.error("Create role error:", error);
        return errorResponse("An error occurred while creating role");
    }
}
