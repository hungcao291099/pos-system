import "reflect-metadata";
import { initializeDatabase } from "../src/lib/db/data-source";
import { DiningTable } from "../src/lib/db/entities";

async function seedDiningTables() {
    try {
        console.log("Starting seed dining tables...");
        const db = await initializeDatabase();
        await db.synchronize();
        console.log("Database synchronized");

        const repo = db.getRepository(DiningTable);

        // ============================================
        // Khu vực: Trong nhà
        // Layout: 2 hàng x 4 cột, bàn cách nhau 130px
        // ============================================
        const indoorTables = [
            // Hàng 1
            { name: "Bàn 1", area: "Trong nhà", capacity: 2, posX: 30, posY: 30, width: 100, height: 100 },
            { name: "Bàn 2", area: "Trong nhà", capacity: 2, posX: 160, posY: 30, width: 100, height: 100 },
            { name: "Bàn 3", area: "Trong nhà", capacity: 4, posX: 290, posY: 30, width: 100, height: 100 },
            { name: "Bàn 4", area: "Trong nhà", capacity: 4, posX: 420, posY: 30, width: 100, height: 100 },
            // Hàng 2
            { name: "Bàn 5", area: "Trong nhà", capacity: 4, posX: 30, posY: 160, width: 100, height: 100 },
            { name: "Bàn 6", area: "Trong nhà", capacity: 4, posX: 160, posY: 160, width: 100, height: 100 },
            { name: "Bàn 7", area: "Trong nhà", capacity: 6, posX: 290, posY: 160, width: 130, height: 100 },
            // Bàn VIP trong nhà
            { name: "VIP 1", area: "Trong nhà", capacity: 8, posX: 460, posY: 160, width: 150, height: 120 },
        ];

        // ============================================
        // Khu vực: Ngoài trời
        // Layout: Bố trí thoáng hơn, bàn cách nhau rộng hơn
        // ============================================
        const outdoorTables = [
            // Hàng 1
            { name: "Sân 1", area: "Ngoài trời", capacity: 2, posX: 30, posY: 30, width: 100, height: 100 },
            { name: "Sân 2", area: "Ngoài trời", capacity: 2, posX: 180, posY: 30, width: 100, height: 100 },
            { name: "Sân 3", area: "Ngoài trời", capacity: 4, posX: 330, posY: 30, width: 100, height: 100 },
            // Hàng 2
            { name: "Sân 4", area: "Ngoài trời", capacity: 4, posX: 30, posY: 180, width: 100, height: 100 },
            { name: "Sân 5", area: "Ngoài trời", capacity: 4, posX: 180, posY: 180, width: 100, height: 100 },
            { name: "Sân 6", area: "Ngoài trời", capacity: 6, posX: 330, posY: 180, width: 130, height: 100 },
        ];

        const allTables = [...indoorTables, ...outdoorTables];

        let created = 0;
        for (const t of allTables) {
            const existing = await repo.findOneBy({ name: t.name, deleted: false });
            if (!existing) {
                await repo.save(repo.create({
                    ...t,
                    status: "empty",
                    isActive: true,
                    createdBy: "system",
                    modifiedBy: "system",
                }));
                console.log(`  ✓ ${t.area} - ${t.name} (${t.capacity} chỗ)`);
                created++;
            } else {
                console.log(`  ⏭ ${t.name} đã tồn tại, bỏ qua`);
            }
        }

        console.log(`\nSeed hoàn tất!`);
        console.log(`- Trong nhà: ${indoorTables.length} bàn`);
        console.log(`- Ngoài trời: ${outdoorTables.length} bàn`);
        console.log(`- Đã tạo mới: ${created} bàn`);
    } catch (error) {
        console.error("Seed dining tables error:", error);
    }
}

seedDiningTables();
