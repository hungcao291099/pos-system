import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { initializeDatabase } from "@/lib/db/data-source";
import { User, UserRole, RolePermission } from "@/lib/db/entities";
import { verifyRefreshToken, generateAccessToken, TokenPayload } from "@/lib/auth/jwt";
import { successResponse, unauthorizedResponse, errorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;

        if (!refreshToken) {
            return unauthorizedResponse("No refresh token provided");
        }

        const payload = await verifyRefreshToken(refreshToken);
        if (!payload) {
            return unauthorizedResponse("Invalid refresh token");
        }

        const db = await initializeDatabase();
        const userRepo = db.getRepository(User);

        const user = await userRepo.findOne({
            where: { id: payload.userId, deleted: false, isActive: true },
        });

        if (!user || user.refreshToken !== refreshToken) {
            return unauthorizedResponse("Invalid refresh token");
        }

        // Get user roles
        const userRoleRepo = db.getRepository(UserRole);
        const userRoles = await userRoleRepo.find({
            where: { userId: user.id },
            relations: ["role"],
        });

        const roles = userRoles.map((ur) => ur.role.name);
        const isAdmin = roles.includes("admin");

        // Get permissions
        const rolePermissionRepo = db.getRepository(RolePermission);
        const roleIds = userRoles.map((ur) => ur.roleId);

        let permissions: string[] = [];
        if (roleIds.length > 0) {
            const rolePermissions = await rolePermissionRepo
                .createQueryBuilder("rp")
                .innerJoinAndSelect("rp.permission", "permission")
                .where("rp.role_id IN (:...roleIds)", { roleIds })
                .getMany();

            permissions = [...new Set(rolePermissions.map((rp) => rp.permission.name))];
        }

        const tokenPayload: TokenPayload = {
            userId: user.id,
            username: user.username,
            roles,
            permissions,
            isAdmin,
        };

        const accessToken = await generateAccessToken(tokenPayload);

        cookieStore.set("access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60, // 15 minutes
        });

        return successResponse({ accessToken });
    } catch (error) {
        console.error("Token refresh error:", error);
        return errorResponse("An error occurred during token refresh");
    }
}
