import "reflect-metadata";
import { initializeDatabase } from "../src/lib/db/data-source";
import {
    Unit,
    ProductCategory,
    Warehouse,
    Supplier,
    Customer,
    Permission,
    Menu,
    RolePermission,
    RoleMenu,
    Role
} from "../src/lib/db/entities";

async function seedMasterData() {
    try {
        console.log("Starting seed master data...");
        const db = await initializeDatabase();

        // Ensure tables exist
        await db.synchronize();
        console.log("Database synchronized");

        // 1. Seed Units
        const unitRepo = db.getRepository(Unit);
        const units = [
            { code: "CAI", name: "Cái", description: "Đơn vị tính cơ bản", isActive: true },
            { code: "CHAI", name: "Chai", description: "Chai nước, dầu gội...", isActive: true },
            { code: "KG", name: "Kilogram", description: "Đơn vị khối lượng", isActive: true },
            { code: "THUNG", name: "Thùng", description: "Thùng hàng", isActive: true },
        ];

        for (const u of units) {
            const existing = await unitRepo.findOneBy({ code: u.code });
            if (!existing) {
                await unitRepo.save(unitRepo.create({ ...u, createdBy: "system", modifiedBy: "system" }));
                console.log(`- Seeded Unit: ${u.code}`);
            }
        }

        // 2. Seed Categories
        const catRepo = db.getRepository(ProductCategory);
        const rootCat = await catRepo.save(catRepo.create({
            code: "DIENTU",
            name: "Điện tử",
            description: "Thiết bị điện tử",
            sortOrder: 1,
            isActive: true,
            createdBy: "system",
            modifiedBy: "system"
        }));
        console.log("- Seeded Root Category: DIENTU");

        await catRepo.save(catRepo.create({
            code: "DIENTHOAI",
            name: "Điện thoại",
            parentId: rootCat.id,
            description: "Các loại điện thoại",
            sortOrder: 1,
            isActive: true,
            createdBy: "system",
            modifiedBy: "system"
        }));
        console.log("- Seeded Sub-Category: DIENTHOAI");

        // 3. Seed Warehouses
        const whRepo = db.getRepository(Warehouse);
        const warehouses = [
            { code: "KHOCHINH", name: "Kho Chính", address: "Hà Nội", description: "Kho trung tâm", isActive: true },
            { code: "KHOPHU", name: "Kho Phụ", address: "Hồ Chí Minh", description: "Kho chi nhánh", isActive: true },
        ];

        for (const wh of warehouses) {
            const existing = await whRepo.findOneBy({ code: wh.code });
            if (!existing) {
                await whRepo.save(whRepo.create({ ...wh, createdBy: "system", modifiedBy: "system" }));
                console.log(`- Seeded Warehouse: ${wh.code}`);
            }
        }

        // 4. Seed Permissions for Master Data
        const permRepo = db.getRepository(Permission);
        const resources = ["supplier", "customer", "unit", "product", "product-category", "warehouse", "price-history"];
        const actions = ["read", "create", "update", "delete"];

        const adminRole = await db.getRepository(Role).findOne({ where: { name: "admin" } });
        const rpRepo = db.getRepository(RolePermission);

        for (const res of resources) {
            for (const act of actions) {
                const permName = `${res}:${act}`; // Using colon to match seed.ts
                let perm = await permRepo.findOne({ where: { resource: res, action: act } });
                if (!perm) {
                    perm = await permRepo.save({
                        name: `${res}:${act}`,
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

        // 5. Seed Menus for Master Data
        const menuRepo = db.getRepository(Menu);
        const masterDataMenu = await menuRepo.findOneBy({ name: "Danh mục" });

        let parentMenuId: number | null = null;
        if (masterDataMenu) {
            parentMenuId = masterDataMenu.id;
        } else {
            const rootMenu = await menuRepo.save(menuRepo.create({
                name: "Danh mục",
                path: "#",
                icon: "Layers",
                sortOrder: 2,
                isActive: true,
                createdBy: "system",
                modifiedBy: "system"
            }));
            parentMenuId = rootMenu.id;
            console.log("- Seeded Parent Menu: Danh mục");
        }

        const subMenus = [
            { name: "Sản phẩm", path: "/product", icon: "Package", order: 1 },
            { name: "Lớp hàng", path: "/product-category", icon: "Layers", order: 2 },
            { name: "Đơn vị tính", path: "/unit", icon: "Ruler", order: 3 },
            { name: "Nhà cung cấp", path: "/supplier", icon: "Truck", order: 4 },
            { name: "Khách hàng", path: "/customer", icon: "Users2", order: 5 },
            { name: "Danh mục kho", path: "/warehouse", icon: "Warehouse", order: 6 },
            { name: "Lịch sử giá", path: "/price-history", icon: "History", order: 7 },
        ];

        const rmRepo = db.getRepository(RoleMenu);

        for (const sm of subMenus) {
            let menu = await menuRepo.findOneBy({ path: sm.path });
            if (!menu) {
                menu = await menuRepo.save(menuRepo.create({
                    name: sm.name,
                    path: sm.path,
                    icon: sm.icon,
                    parentId: parentMenuId || undefined,
                    sortOrder: sm.order,
                    isActive: true,
                    createdBy: "system",
                    modifiedBy: "system"
                }));
                console.log(`- Seeded Menu: ${sm.name}`);
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

        console.log("Seed master data completed successfully!");
    } catch (error) {
        console.error("Seed master data error:", error);
    }
}

seedMasterData();
