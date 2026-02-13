import "reflect-metadata";
import { initializeDatabase } from "../src/lib/db/data-source";
import {
    ProductCategory,
    Product,
    Unit,
    Supplier,
    Warehouse,
    ProductWarehousePrice
} from "../src/lib/db/entities";

async function seedCoffeeShopData() {
    try {
        console.log("Starting seed coffee shop data...");
        const db = await initializeDatabase();
        await db.synchronize();
        console.log("Database synchronized");

        const catRepo = db.getRepository(ProductCategory);
        const productRepo = db.getRepository(Product);
        const unitRepo = db.getRepository(Unit);
        const supplierRepo = db.getRepository(Supplier);
        const warehouseRepo = db.getRepository(Warehouse);
        const priceRepo = db.getRepository(ProductWarehousePrice);

        // ============================================
        // 1. Seed Units
        // ============================================
        const unitData = [
            { code: "LY", name: "Ly", description: "Ly nước", isActive: true },
            { code: "PHAN", name: "Phần", description: "Phần ăn", isActive: true },
            { code: "CHAI", name: "Chai", description: "Chai nước", isActive: true },
            { code: "HOP", name: "Hộp", description: "Hộp", isActive: true },
        ];

        for (const u of unitData) {
            const existing = await unitRepo.findOneBy({ code: u.code });
            if (!existing) {
                await unitRepo.save(unitRepo.create({ ...u, createdBy: "system", modifiedBy: "system" }));
                console.log(`- Seeded Unit: ${u.code}`);
            }
        }

        // Get unit references
        const lyUnit = await unitRepo.findOneBy({ code: "LY" });
        const phanUnit = await unitRepo.findOneBy({ code: "PHAN" });
        const chaiUnit = await unitRepo.findOneBy({ code: "CHAI" });
        const hopUnit = await unitRepo.findOneBy({ code: "HOP" });
        const caiUnit = await unitRepo.findOneBy({ code: "CAI" });
        if (!lyUnit || !phanUnit || !chaiUnit || !hopUnit) {
            throw new Error("Units not found. Run seed-master.ts first.");
        }

        // ============================================
        // 2. Seed Suppliers
        // ============================================
        const supplierData = [
            { code: "NCC-CAPHE", name: "Nhà cung cấp Cà phê Trung Nguyên", phone: "0901234567", address: "Buôn Ma Thuột, Đắk Lắk", email: "cafe@trungnguyen.vn" },
            { code: "NCC-BANH", name: "Nhà cung cấp Bánh ABC", phone: "0907654321", address: "Q.1, TP.HCM", email: "banh@abc.vn" },
            { code: "NCC-TRAICAY", name: "Nhà cung cấp Trái cây tươi", phone: "0912345678", address: "Đà Lạt, Lâm Đồng", email: "traicay@dalat.vn" },
        ];

        for (const s of supplierData) {
            const existing = await supplierRepo.findOneBy({ code: s.code });
            if (!existing) {
                await supplierRepo.save(supplierRepo.create({
                    ...s,
                    isActive: true,
                    createdBy: "system",
                    modifiedBy: "system"
                }));
                console.log(`- Seeded Supplier: ${s.name}`);
            }
        }

        // ============================================
        // 3. Seed Warehouses
        // ============================================
        const warehouseData = [
            { code: "CUAHANG", name: "Cửa hàng chính", address: "123 Nguyễn Huệ, Q.1, TP.HCM", description: "Quầy bán hàng", isActive: true },
            { code: "KHONGUYENLIEU", name: "Kho nguyên liệu", address: "456 Lê Lợi, Q.1, TP.HCM", description: "Kho chứa nguyên liệu", isActive: true },
        ];

        for (const wh of warehouseData) {
            const existing = await warehouseRepo.findOneBy({ code: wh.code });
            if (!existing) {
                await warehouseRepo.save(warehouseRepo.create({
                    ...wh,
                    createdBy: "system",
                    modifiedBy: "system"
                }));
                console.log(`- Seeded Warehouse: ${wh.name}`);
            }
        }

        const mainStore = await warehouseRepo.findOneBy({ code: "CUAHANG" });
        if (!mainStore) throw new Error("Main store warehouse not found");

        // ============================================
        // 4. Seed Product Categories
        // ============================================
        const categoryData = [
            // Pha chế (không cần tồn kho)
            { code: "CAPHE", name: "Cà phê", description: "Các loại cà phê", isPreparation: true, sortOrder: 1 },
            { code: "TRA", name: "Trà", description: "Các loại trà", isPreparation: true, sortOrder: 2 },
            { code: "SINHTODAXA", name: "Sinh tố - Đá xay", description: "Sinh tố và đá xay", isPreparation: true, sortOrder: 3 },
            { code: "NUOCEP", name: "Nước ép", description: "Nước ép trái cây", isPreparation: true, sortOrder: 4 },
            // Không pha chế (cần tồn kho)
            { code: "BANHNGOT", name: "Bánh ngọt", description: "Các loại bánh ngọt", isPreparation: false, sortOrder: 5 },
            { code: "SNACK", name: "Snack", description: "Đồ ăn vặt", isPreparation: false, sortOrder: 6 },
            { code: "NUOCDONGCHAI", name: "Nước đóng chai", description: "Nước suối, nước ngọt đóng chai", isPreparation: false, sortOrder: 7 },
            { code: "SUACHUA", name: "Sữa chua", description: "Các loại sữa chua", isPreparation: false, sortOrder: 8 },
            { code: "TOPPING", name: "Topping", description: "Topping thêm cho đồ uống", isPreparation: false, sortOrder: 9 },
        ];

        const categoryMap: Record<string, number> = {};
        for (const cat of categoryData) {
            let existing = await catRepo.findOneBy({ code: cat.code });
            if (!existing) {
                existing = await catRepo.save(catRepo.create({
                    ...cat,
                    isActive: true,
                    createdBy: "system",
                    modifiedBy: "system"
                }));
                console.log(`- Seeded Category: ${cat.name} (isPreparation: ${cat.isPreparation})`);
            } else {
                // Update isPreparation if needed
                if (existing.isPreparation !== cat.isPreparation) {
                    existing.isPreparation = cat.isPreparation;
                    await catRepo.save(existing);
                    console.log(`- Updated Category: ${cat.name} (isPreparation: ${cat.isPreparation})`);
                }
            }
            categoryMap[cat.code] = existing.id;
        }

        // ============================================
        // 5. Seed Products
        // ============================================
        const products = [
            // Cà phê
            { code: "CF-SUA-DA", name: "Cà phê sữa đá", categoryCode: "CAPHE", unitCode: "LY", purchasePrice: 8000, defaultSellPrice: 29000 },
            { code: "CF-DEN", name: "Cà phê đen", categoryCode: "CAPHE", unitCode: "LY", purchasePrice: 6000, defaultSellPrice: 25000 },
            { code: "CF-BAC-XIU", name: "Bạc xỉu", categoryCode: "CAPHE", unitCode: "LY", purchasePrice: 9000, defaultSellPrice: 32000 },
            { code: "CF-CAPPUCCINO", name: "Cappuccino", categoryCode: "CAPHE", unitCode: "LY", purchasePrice: 12000, defaultSellPrice: 45000 },
            { code: "CF-LATTE", name: "Latte", categoryCode: "CAPHE", unitCode: "LY", purchasePrice: 12000, defaultSellPrice: 45000 },
            { code: "CF-MOCHA", name: "Mocha", categoryCode: "CAPHE", unitCode: "LY", purchasePrice: 14000, defaultSellPrice: 49000 },
            // Trà
            { code: "TRA-DAO", name: "Trà đào cam sả", categoryCode: "TRA", unitCode: "LY", purchasePrice: 10000, defaultSellPrice: 35000 },
            { code: "TRA-VAI", name: "Trà vải", categoryCode: "TRA", unitCode: "LY", purchasePrice: 10000, defaultSellPrice: 35000 },
            { code: "TRA-SUA", name: "Trà sữa trân châu", categoryCode: "TRA", unitCode: "LY", purchasePrice: 12000, defaultSellPrice: 39000 },
            { code: "TRA-MATCHA", name: "Matcha đá xay", categoryCode: "TRA", unitCode: "LY", purchasePrice: 15000, defaultSellPrice: 45000 },
            // Sinh tố - Đá xay
            { code: "ST-BO", name: "Sinh tố bơ", categoryCode: "SINHTODAXA", unitCode: "LY", purchasePrice: 15000, defaultSellPrice: 39000 },
            { code: "ST-XOAI", name: "Sinh tố xoài", categoryCode: "SINHTODAXA", unitCode: "LY", purchasePrice: 12000, defaultSellPrice: 35000 },
            { code: "ST-DAUTAY", name: "Sinh tố dâu tây", categoryCode: "SINHTODAXA", unitCode: "LY", purchasePrice: 15000, defaultSellPrice: 42000 },
            // Nước ép
            { code: "NE-CAM", name: "Nước ép cam", categoryCode: "NUOCEP", unitCode: "LY", purchasePrice: 10000, defaultSellPrice: 29000 },
            { code: "NE-DUA-HAU", name: "Nước ép dưa hấu", categoryCode: "NUOCEP", unitCode: "LY", purchasePrice: 8000, defaultSellPrice: 25000 },
            // Bánh ngọt
            { code: "BANH-CROISSANT", name: "Bánh Croissant", categoryCode: "BANHNGOT", unitCode: "PHAN", purchasePrice: 15000, defaultSellPrice: 35000 },
            { code: "BANH-TIRAMISU", name: "Bánh Tiramisu", categoryCode: "BANHNGOT", unitCode: "PHAN", purchasePrice: 20000, defaultSellPrice: 45000 },
            { code: "BANH-CHEESE", name: "Bánh Cheese Cake", categoryCode: "BANHNGOT", unitCode: "PHAN", purchasePrice: 22000, defaultSellPrice: 49000 },
            // Snack
            { code: "SNACK-KHOAI", name: "Khoai tây chiên", categoryCode: "SNACK", unitCode: "PHAN", purchasePrice: 12000, defaultSellPrice: 29000 },
            { code: "SNACK-GA", name: "Gà viên chiên", categoryCode: "SNACK", unitCode: "PHAN", purchasePrice: 15000, defaultSellPrice: 35000 },
            // Nước đóng chai
            { code: "NC-AQUA", name: "Nước suối Aquafina 500ml", categoryCode: "NUOCDONGCHAI", unitCode: "CHAI", purchasePrice: 3000, defaultSellPrice: 10000 },
            { code: "NC-COCA", name: "Coca Cola 330ml", categoryCode: "NUOCDONGCHAI", unitCode: "CHAI", purchasePrice: 5000, defaultSellPrice: 15000 },
            { code: "NC-PEPSI", name: "Pepsi 330ml", categoryCode: "NUOCDONGCHAI", unitCode: "CHAI", purchasePrice: 5000, defaultSellPrice: 15000 },
            { code: "NC-7UP", name: "7Up 330ml", categoryCode: "NUOCDONGCHAI", unitCode: "CHAI", purchasePrice: 5000, defaultSellPrice: 15000 },
            { code: "NC-REDBULL", name: "Red Bull 250ml", categoryCode: "NUOCDONGCHAI", unitCode: "CHAI", purchasePrice: 8000, defaultSellPrice: 20000 },
            // Sữa chua
            { code: "SC-VINAMILK", name: "Sữa chua Vinamilk", categoryCode: "SUACHUA", unitCode: "HOP", purchasePrice: 4000, defaultSellPrice: 10000 },
            { code: "SC-GREEK", name: "Sữa chua Hy Lạp (Greek Yogurt)", categoryCode: "SUACHUA", unitCode: "HOP", purchasePrice: 12000, defaultSellPrice: 25000 },
            { code: "SC-DAUTAY", name: "Sữa chua dâu tây", categoryCode: "SUACHUA", unitCode: "HOP", purchasePrice: 5000, defaultSellPrice: 12000 },
            // Topping
            { code: "TP-TRANCHAU", name: "Trân châu đen", categoryCode: "TOPPING", unitCode: "PHAN", purchasePrice: 2000, defaultSellPrice: 5000 },
            { code: "TP-THACHRTC", name: "Thạch rau câu", categoryCode: "TOPPING", unitCode: "PHAN", purchasePrice: 2000, defaultSellPrice: 5000 },
            { code: "TP-PUDDING", name: "Pudding trứng", categoryCode: "TOPPING", unitCode: "PHAN", purchasePrice: 3000, defaultSellPrice: 8000 },
        ];

        for (const p of products) {
            let existing = await productRepo.findOneBy({ code: p.code });
            if (!existing) {
                const unit = p.unitCode === "LY" ? lyUnit :
                    p.unitCode === "CHAI" ? chaiUnit :
                        p.unitCode === "HOP" ? hopUnit :
                            p.unitCode === "PHAN" ? phanUnit :
                                caiUnit;

                existing = await productRepo.save(productRepo.create({
                    code: p.code,
                    name: p.name,
                    categoryId: categoryMap[p.categoryCode],
                    unitId: unit!.id,
                    purchasePrice: p.purchasePrice,
                    defaultSellPrice: p.defaultSellPrice,
                    isActive: true,
                    createdBy: "system",
                    modifiedBy: "system"
                }));
                console.log(`- Seeded Product: ${p.name} (${p.code})`);
            }

            // Set warehouse price for main store
            const existingPrice = await priceRepo.findOne({
                where: { productId: existing.id, warehouseId: mainStore.id }
            });
            if (!existingPrice) {
                await priceRepo.save(priceRepo.create({
                    productId: existing.id,
                    warehouseId: mainStore.id,
                    sellPrice: p.defaultSellPrice,
                    isActive: true,
                    createdBy: "system",
                    modifiedBy: "system"
                }));
                console.log(`  -> Set price for ${p.name} at Cửa hàng chính: ${p.defaultSellPrice.toLocaleString()}`);
            }
        }

        console.log("\nSeed coffee shop data completed successfully!");
        console.log(`- ${categoryData.length} categories`);
        console.log(`- ${products.length} products`);
        console.log(`- ${supplierData.length} suppliers`);
        console.log(`- ${warehouseData.length} warehouses`);
    } catch (error) {
        console.error("Seed coffee shop data error:", error);
    }
}

seedCoffeeShopData();
