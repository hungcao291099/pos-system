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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "user", "read");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const userId = parseInt(id);

        const db = await initializeDatabase();
        const userRepo = db.getRepository(User);

        const foundUser = await userRepo.findOne({
            where: { id: userId, deleted: false },
        });

        if (!foundUser) {
            return badRequestResponse("User not found");
        }

        const userRoleRepo = db.getRepository(UserRole);
        const userRoles = await userRoleRepo.find({
            where: { userId: foundUser.id },
            relations: ["role"],
        });

        return successResponse({
            id: foundUser.id,
            username: foundUser.username,
            email: foundUser.email,
            fullName: foundUser.fullName,
            isActive: foundUser.isActive,
            avatar: foundUser.avatar,
            createdAt: foundUser.createdAt,
            modifiedAt: foundUser.modifiedAt,
            roles: userRoles.map((ur) => ({
                id: ur.role.id,
                name: ur.role.name,
            })),
        });
    } catch (error) {
        console.error("Get user error:", error);
        return errorResponse("An error occurred while fetching user");
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "user", "update");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const userId = parseInt(id);
        const body = await request.json();

        const db = await initializeDatabase();
        const userRepo = db.getRepository(User);

        const user = await userRepo.findOne({
            where: { id: userId, deleted: false },
        });

        if (!user) {
            return badRequestResponse("User not found");
        }

        // Update user fields
        if (body.email !== undefined) user.email = body.email;
        if (body.fullName !== undefined) user.fullName = body.fullName;
        if (body.isActive !== undefined) user.isActive = body.isActive;
        if (body.avatar !== undefined) user.avatar = body.avatar;
        if (body.password) {
            user.password = await hashPassword(body.password);
        }
        user.modifiedBy = authUser?.username || "system";

        await userRepo.save(user);

        return successResponse(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                isActive: user.isActive,
            },
            "User updated successfully"
        );
    } catch (error) {
        console.error("Update user error:", error);
        return errorResponse("An error occurred while updating user");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "user", "delete");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const userId = parseInt(id);

        const db = await initializeDatabase();
        const userRepo = db.getRepository(User);

        const user = await userRepo.findOne({
            where: { id: userId, deleted: false },
        });

        if (!user) {
            return badRequestResponse("User not found");
        }

        // Soft delete
        user.deleted = true;
        user.deletedAt = new Date();
        user.deletedBy = authUser?.username || "system";

        await userRepo.save(user);

        return successResponse(null, "User deleted successfully");
    } catch (error) {
        console.error("Delete user error:", error);
        return errorResponse("An error occurred while deleting user");
    }
}
