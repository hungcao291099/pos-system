import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { User, UserRole, Role, RolePermission } from "@/lib/db/entities";
import { comparePassword } from "@/lib/auth/bcrypt";
import { generateAccessToken, generateRefreshToken, TokenPayload } from "@/lib/auth/jwt";
import { successResponse, badRequestResponse, errorResponse } from "@/lib/api-utils";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password, rememberMe } = body;

        if (!username || !password) {
            return badRequestResponse("Username and password are required");
        }

        const db = await initializeDatabase();
        const userRepo = db.getRepository(User);

        const user = await userRepo.findOne({
            where: { username, deleted: false, isActive: true },
        });

        if (!user) {
            return badRequestResponse("Invalid username or password");
        }

        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return badRequestResponse("Invalid username or password");
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
        const refreshToken = await generateRefreshToken({ userId: user.id });

        // Update user's refresh token and last login
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await userRepo.save(user);

        // Set cookies
        const cookieStore = await cookies();
        cookieStore.set("access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: rememberMe ? 7 * 24 * 60 * 60 : 15 * 60, // 7 days or 15 minutes
        });

        cookieStore.set("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return successResponse({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                avatar: user.avatar,
                isActive: user.isActive,
                roles: userRoles.map((ur) => ({
                    id: ur.role.id,
                    name: ur.role.name,
                })),
            },
            accessToken,
        });
    } catch (error) {
        console.error("Login error:", error);
        return errorResponse("An error occurred during login");
    }
}
