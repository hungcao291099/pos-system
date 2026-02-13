import "reflect-metadata";
import { initializeDatabase } from "../src/lib/db/data-source";
import { Menu, Role, RoleMenu, Permission, RolePermission } from "../src/lib/db/entities";

async function seedPosMenus() {
    try {
        console.log("Starting seed POS menus...");
        const db = await initializeDatabase();

        const menuRepo = db.getRepository(Menu);
        const roleRepo = db.getRepository(Role);
        const rmRepo = db.getRepository(RoleMenu);
        const permRepo = db.getRepository(Permission);
        const rpRepo = db.getRepository(RolePermission);

        const adminRole = await roleRepo.findOne({ where: { name: "admin" } });
        if (!adminRole) {
            console.error("Admin role not found!");
            return;
        }

        // 1. Create permissions for Table and Area
        const resources = ["table", "area"];
        const actions = ["read", "create", "update", "delete"];

        for (const res of resources) {
            for (const act of actions) {
                const permName = `${res}:${act}`;
                let perm = await permRepo.findOne({ where: { resource: res, action: act } });
                if (!perm) {
                    perm = await permRepo.save({
                        name: permName,
                        description: `Permission to ${act} ${res}`,
                        resource: res,
                        action: act,
                        createdBy: "system",
                        modifiedBy: "system"
                    } as any);
                    console.log(`- Seeded Permission: ${permName}`);
                }

                if (perm) {
                    const existingRP = await rpRepo.findOne({ where: { roleId: adminRole.id, permissionId: perm.id } });
                    if (!existingRP) {
                        await rpRepo.save({
                            roleId: adminRole.id,
                            permissionId: perm.id,
                            createdBy: "system"
                        } as any);
                        console.log(`- Assigned Permission ${permName} to Admin`);
                    }
                }
            }
        }

        // 2. Create Root Menu: Phòng bàn
        let rootMenu = await menuRepo.findOneBy({ name: "Phòng bàn" });
        if (!rootMenu) {
            rootMenu = await menuRepo.save(menuRepo.create({
                name: "Phòng bàn",
                path: "#",
                icon: "Layout",
                sortOrder: 10,
                isActive: true,
                createdBy: "system",
                modifiedBy: "system"
            }));
            console.log("- Seeded Parent Menu: Phòng bàn");
        }

        // 3. Create Sub-menus
        const subMenus = [
            { name: "Sơ đồ bàn", path: "/table-layout", icon: "Grid", order: 1 },
            { name: "Danh sách bàn", path: "/table", icon: "List", order: 2 },
            { name: "Khu vực", path: "/area", icon: "Map", order: 3 },
        ];

        for (const sm of subMenus) {
            let menu = await menuRepo.findOneBy({ path: sm.path });
            if (!menu) {
                menu = await menuRepo.save(menuRepo.create({
                    name: sm.name,
                    path: sm.path,
                    icon: sm.icon,
                    parentId: rootMenu.id,
                    sortOrder: sm.order,
                    isActive: true,
                    createdBy: "system",
                    modifiedBy: "system"
                }));
                console.log(`- Seeded Menu: ${sm.name}`);
            } else {
                // Update parent and icon if exists
                menu.parentId = rootMenu.id;
                menu.icon = sm.icon;
                await menuRepo.save(menu);
            }

            if (menu) {
                const existingRM = await rmRepo.findOne({ where: { roleId: adminRole.id, menuId: menu.id } });
                if (!existingRM) {
                    await rmRepo.save({
                        roleId: adminRole.id,
                        menuId: menu.id,
                        createdBy: "system"
                    } as any);
                    console.log(`- Assigned Menu ${sm.name} to Admin`);
                }
            }
        }

        // Ensure root menu is assigned to Admin too
        const rootRM = await rmRepo.findOne({ where: { roleId: adminRole.id, menuId: rootMenu.id } });
        if (!rootRM) {
            await rmRepo.save({
                roleId: adminRole.id,
                menuId: rootMenu.id,
                createdBy: "system"
            } as any);
            console.log(`- Assigned Parent Menu Phòng bàn to Admin`);
        }

        console.log("Seed POS menus completed successfully!");
    } catch (error) {
        console.error("Seed POS menus error:", error);
    }
}

seedPosMenus();
