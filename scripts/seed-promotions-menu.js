const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

function seed() {
    try {
        console.log('Starting final JS seed promotions menu...');

        // Find Admin Role (lowercase 'admin' based on DB check)
        const adminRole = db.prepare('SELECT id FROM roles WHERE LOWER(name) = ?').get('admin');
        if (!adminRole) {
            console.error('Admin role not found');
            return;
        }
        const adminRoleId = adminRole.id;

        // Helper to insert menu
        function insertMenu(name, path, icon, parentId, sortOrder) {
            try {
                let menu = db.prepare('SELECT id FROM menus WHERE path = ?').get(path);
                let menuId;

                if (!menu) {
                    const info = db.prepare(`
                        INSERT INTO menus (name, path, icon, parent_id, sort_order)
                        VALUES (?, ?, ?, ?, ?)
                    `).run(name, path, icon, parentId, sortOrder);
                    menuId = info.lastInsertRowid;
                    console.log(`Created menu: ${name}`);
                } else {
                    menuId = menu.id;
                }

                // Assign to Admin if not already assigned
                const existingLink = db.prepare('SELECT id FROM role_menus WHERE role_id = ? AND menu_id = ?').get(adminRoleId, menuId);
                if (!existingLink) {
                    db.prepare('INSERT INTO role_menus (role_id, menu_id) VALUES (?, ?)')
                        .run(adminRoleId, menuId);
                    console.log(`Assigned menu ${name} to admin role`);
                }

                return menuId;
            } catch (err) {
                console.error(`Error processing menu ${name}:`, err.message);
                throw err;
            }
        }

        // 1. Create Parent Menu "Khuyến mãi"
        const promoParentId = insertMenu('Khuyến mãi', '/promotions', 'Gift', null, 10);

        // 2. Create "Giảm giá sản phẩm"
        insertMenu('Giảm giá sản phẩm', '/discount-policy', 'Tag', promoParentId, 1);

        // 3. Create "Mua X tặng Y"
        insertMenu('Mua X tặng Y', '/promotion-policy', 'Percent', promoParentId, 2);

        console.log('JS Seed completed successfully!');
    } catch (error) {
        console.error('JS Seed error:', error.message);
    } finally {
        db.close();
    }
}

seed();
