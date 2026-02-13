import "reflect-metadata";
import { initializeDatabase } from "../src/lib/db/data-source";
import { Menu, Role, RoleMenu } from "../src/lib/db/entities";

async function seedPromotionsMenu() {
    try {
        console.log("Starting seed promotions menu...");
        const db = await initializeDatabase();
        const menuRepo = db.getRepository(Menu);
        const roleRepo = db.getRepository(Role);
        const roleMenuRepo = db.getRepository(RoleMenu);

        const adminRole = await roleRepo.findOneBy({ code: "ADMIN" });
        if (!adminRole) {
            console.error("Admin role not found");
            return;
        }

        // 1. Create Parent Menu "Khuyến mãi"
        let promoParent = await menuRepo.findOneBy({ path: "/promotions" });
        if (!promoParent) {
            promoParent = await menuRepo.save(menuRepo.create({
                name: "Khuyến mãi",
                path: "/promotions",
                icon: "Gift",
                sortOrder: 10,
                isActive: true,
                createdBy: "system",
                modifiedBy: "system"
            }));
            console.log("Created parent menu: Khuyến mãi");

            // Assign to Admin
            await roleMenuRepo.save(roleMenuRepo.create({
                roleId: adminRole.id,
                menuId: promoParent.id,
                createdBy: "system",
                modifiedBy: "system"
            }));
        }

        // 2. Create "Chính sách giảm giá"
        let discountMenu = await menuRepo.findOneBy({ path: "/discount-policy" });
        if (!discountMenu) {
            discountMenu = await menuRepo.save(menuRepo.create({
                name: "Giảm giá sản phẩm",
                path: "/discount-policy",
                icon: "Tag",
                parentId: promoParent.id,
                sortOrder: 1,
                isActive: true,
                createdBy: "system",
                modifiedBy: "system"
            }));
            console.log("Created menu: Giảm giá sản phẩm");

            // Assign to Admin
            await roleMenuRepo.save(roleMenuRepo.create({
                roleId: adminRole.id,
                menuId: discountMenu.id,
                createdBy: "system",
                modifiedBy: "system"
            }));
        }

        // 3. Create "Chính sách khuyến mãi"
        let promoMenu = await menuRepo.findOneBy({ path: "/promotion-policy" });
        if (!promoMenu) {
            promoMenu = await menuRepo.save(menuRepo.create({
                name: "Mua X tặng Y",
                path: "/promotion-policy",
                icon: "Percent",
                parentId: promoParent.id,
                sortOrder: 2,
                isActive: true,
                createdBy: "system",
                modifiedBy: "system"
            }));
            console.log("Created menu: Mua X tặng Y");

            // Assign to Admin
            await roleMenuRepo.save(roleMenuRepo.create({
                roleId: adminRole.id,
                menuId: promoMenu.id,
                createdBy: "system",
                modifiedBy: "system"
            }));
        }

        console.log("Seed promotions menu completed successfully!");
    } catch (error) {
        console.error("Seed promotions menu error:", error);
    }
}

seedPromotionsMenu();
