import "reflect-metadata";
import { AppDataSource } from "../src/lib/db/data-source";
import { User, Role, Menu, Permission, UserRole, RolePermission, RoleMenu } from "../src/lib/db/entities";
import { hashPassword } from "../src/lib/auth/bcrypt";

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected");

        // Create tables (sync for development)
        await AppDataSource.synchronize();
        console.log("Tables synchronized");

        const userRepo = AppDataSource.getRepository(User);
        const roleRepo = AppDataSource.getRepository(Role);
        const menuRepo = AppDataSource.getRepository(Menu);
        const permissionRepo = AppDataSource.getRepository(Permission);
        const userRoleRepo = AppDataSource.getRepository(UserRole);
        const rolePermissionRepo = AppDataSource.getRepository(RolePermission);
        const roleMenuRepo = AppDataSource.getRepository(RoleMenu);

        // Check if admin exists
        const existingAdmin = await userRepo.findOne({ where: { username: "admin" } });
        if (existingAdmin) {
            console.log("Seed data already exists. Skipping...");
            await AppDataSource.destroy();
            return;
        }

        // Create roles
        console.log("Creating roles...");
        const adminRole = await roleRepo.save({
            name: "admin",
            description: "Administrator với toàn quyền",
            isActive: true,
            createdBy: "system",
            modifiedBy: "system",
        });

        const userRole = await roleRepo.save({
            name: "user",
            description: "Người dùng thông thường",
            isActive: true,
            createdBy: "system",
            modifiedBy: "system",
        });

        // Create menus
        console.log("Creating menus...");
        const menus = [
            { name: "Trang chủ", path: "/home", icon: "Home", sortOrder: 1 },
            { name: "Người dùng", path: "/user", icon: "Users", sortOrder: 2 },
            { name: "Vai trò", path: "/role", icon: "Shield", sortOrder: 3 },
            { name: "Menu", path: "/menu", icon: "Menu", sortOrder: 4 },
            { name: "Quyền hạn", path: "/permission", icon: "Lock", sortOrder: 5 },
            { name: "Tài khoản", path: "/account", icon: "User", sortOrder: 6 },
        ];

        const createdMenus = [];
        for (const menuData of menus) {
            const menu = await menuRepo.save({
                ...menuData,
                isActive: true,
                createdBy: "system",
                modifiedBy: "system",
            });
            createdMenus.push(menu);
        }

        // Create permissions
        console.log("Creating permissions...");
        const resources = ["user", "role", "menu", "permission"];
        const actions = ["create", "read", "update", "delete"];

        const createdPermissions = [];
        for (const resource of resources) {
            for (const action of actions) {
                const permission = await permissionRepo.save({
                    name: `${resource}:${action}`,
                    description: `${action} ${resource}`,
                    resource,
                    action,
                    createdBy: "system",
                    modifiedBy: "system",
                });
                createdPermissions.push(permission);
            }
        }

        // Create admin user
        console.log("Creating admin user...");
        const hashedPassword = await hashPassword("admin123");
        const admin = await userRepo.save({
            username: "admin",
            password: hashedPassword,
            email: "admin@example.com",
            fullName: "Administrator",
            isActive: true,
            createdBy: "system",
            modifiedBy: "system",
        });

        // Assign admin role to admin user
        await userRoleRepo.save({
            userId: admin.id,
            roleId: adminRole.id,
            createdBy: "system",
        });

        // Assign all permissions to admin role
        for (const permission of createdPermissions) {
            await rolePermissionRepo.save({
                roleId: adminRole.id,
                permissionId: permission.id,
                createdBy: "system",
            });
        }

        // Assign all menus to admin role
        for (const menu of createdMenus) {
            await roleMenuRepo.save({
                roleId: adminRole.id,
                menuId: menu.id,
                createdBy: "system",
            });
        }

        // Assign read permissions to user role
        const readPermissions = createdPermissions.filter((p) => p.action === "read");
        for (const permission of readPermissions) {
            await rolePermissionRepo.save({
                roleId: userRole.id,
                permissionId: permission.id,
                createdBy: "system",
            });
        }

        // Assign home and account menus to user role
        const userMenus = createdMenus.filter((m) => m.path === "/home" || m.path === "/account");
        for (const menu of userMenus) {
            await roleMenuRepo.save({
                roleId: userRole.id,
                menuId: menu.id,
                createdBy: "system",
            });
        }

        console.log("Seed completed successfully!");
        console.log("---");
        console.log("Admin credentials:");
        console.log("  Username: admin");
        console.log("  Password: admin123");
        console.log("---");

        await AppDataSource.destroy();
    } catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    }
}

seed();
