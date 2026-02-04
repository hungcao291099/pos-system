import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { User, UserRole } from "@/lib/db/entities";
import { hashPassword } from "@/lib/auth/bcrypt";
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
        const permissionCheck = requirePermission(user, "user", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const userRepo = db.getRepository(User);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";

        const queryBuilder = userRepo
            .createQueryBuilder("user")
            .where("user.deleted = :deleted", { deleted: false });

        if (search) {
            queryBuilder.andWhere(
                "(user.username LIKE :search OR user.fullName LIKE :search OR user.email LIKE :search)",
                { search: `%${search}%` }
            );
        }

        const [users, total] = await queryBuilder
            .orderBy("user.created_at", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        // Get roles for each user
        const userRoleRepo = db.getRepository(UserRole);
        const usersWithRoles = await Promise.all(
            users.map(async (u) => {
                const userRoles = await userRoleRepo.find({
                    where: { userId: u.id },
                    relations: ["role"],
                });
                return {
                    id: u.id,
                    username: u.username,
                    email: u.email,
                    fullName: u.fullName,
                    isActive: u.isActive,
                    avatar: u.avatar,
                    createdAt: u.createdAt,
                    modifiedAt: u.modifiedAt,
                    roles: userRoles.map((ur) => ({
                        id: ur.role.id,
                        name: ur.role.name,
                    })),
                };
            })
        );

        return successResponse({
            items: usersWithRoles,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error("Get users error:", error);
        return errorResponse("An error occurred while fetching users");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "user", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const { username, password, email, fullName, isActive = true, roleIds = [] } = body;

        if (!username || !password) {
            return badRequestResponse("Username and password are required");
        }

        const db = await initializeDatabase();
        const userRepo = db.getRepository(User);

        // Check if username already exists
        const existingUser = await userRepo.findOne({
            where: { username, deleted: false },
        });
        if (existingUser) {
            return badRequestResponse("Username already exists");
        }

        // Create user
        const hashedPassword = await hashPassword(password);
        const user = userRepo.create({
            username,
            password: hashedPassword,
            email,
            fullName,
            isActive,
            createdBy: authUser?.username || "system",
            modifiedBy: authUser?.username || "system",
        });

        await userRepo.save(user);

        // Assign roles if provided
        if (roleIds.length > 0) {
            const userRoleRepo = db.getRepository(UserRole);
            const userRoles = roleIds.map((roleId: number) => ({
                userId: user.id,
                roleId,
                createdBy: authUser?.username || "system",
            }));
            await userRoleRepo.save(userRoles);
        }

        return successResponse(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                isActive: user.isActive,
            },
            "User created successfully"
        );
    } catch (error) {
        console.error("Create user error:", error);
        return errorResponse("An error occurred while creating user");
    }
}
