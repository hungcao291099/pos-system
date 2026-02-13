import "reflect-metadata";
import { initializeDatabase } from "../src/lib/db/data-source";
import {
    Permission,
    Menu,
    RolePermission,
    RoleMenu,
    Role
} from "../src/lib/db/entities";

async function seedInventorySalesData() {
    try {
        console.log("Starting seed inventory & sales data...");
        const db = await initializeDatabase();

        // Ensure tables exist
        await db.synchronize();
        console.log("Database synchronized");

        const permRepo = db.getRepository(Permission);
        const menuRepo = db.getRepository(Menu);
        const rpRepo = db.getRepository(RolePermission);
        const rmRepo = db.getRepository(RoleMenu);

        const adminRole = await db.getRepository(Role).findOne({ where: { name: "admin" } });

        // 1. Seed Permissions for Inventory & Sales
        const resources = ["goods-receipt", "stock-out", "inventory", "sales"];
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

                if (adminRole && perm) {
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

        // 2. Seed Main Parent Menu for Operation (Vận hành)
        let operationMenu = await menuRepo.findOneBy({ name: "Vận hành" });
        if (!operationMenu) {
            operationMenu = await menuRepo.save(menuRepo.create({
                name: "Vận hành",
                path: "#",
                icon: "Settings2",
                sortOrder: 1,
                isActive: true,
                createdBy: "system",
                modifiedBy: "system"
            }));
            console.log("- Seeded Main Parent Menu: Vận hành");
        }

        // Assign operation menu to admin
        if (adminRole && operationMenu) {
            const existingRM = await rmRepo.findOne({ where: { roleId: adminRole.id, menuId: operationMenu.id } });
            if (!existingRM) {
                await rmRepo.save({
                    roleId: adminRole.id,
                    menuId: operationMenu.id,
                    createdBy: "system"
                } as any);
            }
        }

        // 3. Seed "Kho vận" Menu under "Vận hành"
        let inventoryMenu = await menuRepo.findOneBy({ name: "Kho vận" });
        if (!inventoryMenu) {
            inventoryMenu = await menuRepo.save(menuRepo.create({
                name: "Kho vận",
                path: "#",
                icon: "Warehouse",
                parentId: operationMenu.id,
                sortOrder: 1,
                isActive: true,
                createdBy: "system",
                modifiedBy: "system"
            }));
            console.log("- Seeded Menu: Kho vận (under Vận hành)");
        } else if (inventoryMenu.parentId !== operationMenu.id) {
            inventoryMenu.parentId = operationMenu.id;
            inventoryMenu.sortOrder = 1;
            await menuRepo.save(inventoryMenu);
            console.log("- Updated Menu: Kho vận (moved under Vận hành)");
        }

        // Assign "Kho vận" to admin
        if (adminRole && inventoryMenu) {
            const existingRM = await rmRepo.findOne({ where: { roleId: adminRole.id, menuId: inventoryMenu.id } });
            if (!existingRM) {
                await rmRepo.save({
                    roleId: adminRole.id,
                    menuId: inventoryMenu.id,
                    createdBy: "system"
                } as any);
            }
        }

        // 4. Seed Sub Menus for "Kho vận"
        const inventorySubMenus = [
            { name: "Nhập hàng", path: "/goods-receipt", icon: "PackagePlus", order: 1 },
            { name: "Xuất kho", path: "/stock-out", icon: "PackageMinus", order: 2 },
            { name: "Tồn kho", path: "/inventory", icon: "LayoutGrid", order: 3 },
        ];

        for (const sm of inventorySubMenus) {
            let menu = await menuRepo.findOneBy({ path: sm.path });
            if (!menu) {
                menu = await menuRepo.save(menuRepo.create({
                    name: sm.name,
                    path: sm.path,
                    icon: sm.icon,
                    parentId: inventoryMenu.id,
                    sortOrder: sm.order,
                    isActive: true,
                    createdBy: "system",
                    modifiedBy: "system"
                }));
                console.log(`- Seeded Menu: ${sm.name}`);
            } else if (menu.parentId !== inventoryMenu.id) {
                menu.parentId = inventoryMenu.id;
                menu.sortOrder = sm.order;
                await menuRepo.save(menu);
                console.log(`- Updated Menu: ${sm.name} (moved under Kho vận)`);
            }

            if (adminRole && menu) {
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

        // 5. Seed "Bán hàng" (POS) Menu under "Vận hành"
        let posMenu = await menuRepo.findOneBy({ path: "/pos" });
        if (!posMenu) {
            posMenu = await menuRepo.save(menuRepo.create({
                name: "Bán hàng",
                path: "/pos",
                icon: "ShoppingCart",
                parentId: operationMenu.id,
                sortOrder: 2,
                isActive: true,
                createdBy: "system",
                modifiedBy: "system"
            }));
            console.log("- Seeded Menu: Bán hàng (under Vận hành)");
        } else if (posMenu.parentId !== operationMenu.id) {
            posMenu.parentId = operationMenu.id;
            posMenu.sortOrder = 2;
            await menuRepo.save(posMenu);
            console.log("- Updated Menu: Bán hàng (moved under Vận hành)");
        }

        if (adminRole && posMenu) {
            const existingRM = await rmRepo.findOne({ where: { roleId: adminRole.id, menuId: posMenu.id } });
            if (!existingRM) {
                await rmRepo.save({
                    roleId: adminRole.id,
                    menuId: posMenu.id,
                    createdBy: "system"
                } as any);
                console.log("- Assigned Menu Bán hàng to Admin");
            }
        }

        console.log("Seed inventory & sales data completed successfully!");
    } catch (error) {
        console.error("Seed inventory & sales data error:", error);
    }
}

seedInventorySalesData();
