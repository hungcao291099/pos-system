import { initializeDatabase } from "../db/data-source";
import { DiningTable } from "../db/entities";

export interface CreateTableInput {
    name: string;
    area?: string;
    capacity?: number;
    posX?: number;
    posY?: number;
    width?: number;
    height?: number;
}

export interface UpdateTableInput {
    name?: string;
    area?: string;
    capacity?: number;
    isActive?: boolean;
}

export interface LayoutPosition {
    id: number;
    posX: number;
    posY: number;
    width?: number;
    height?: number;
}

export class TableService {
    static async listTables(): Promise<DiningTable[]> {
        const db = await initializeDatabase();
        const repo = db.getRepository(DiningTable);
        return repo.find({
            where: { deleted: false },
            order: { name: "ASC" },
        });
    }

    static async createTable(input: CreateTableInput, userId: string): Promise<DiningTable> {
        const db = await initializeDatabase();
        const repo = db.getRepository(DiningTable);

        const table = repo.create({
            name: input.name,
            area: input.area ?? "Trong nhà",
            capacity: input.capacity ?? 4,
            posX: input.posX ?? 0,
            posY: input.posY ?? 0,
            width: input.width ?? 100,
            height: input.height ?? 100,
            status: "empty",
            isActive: true,
            createdBy: userId,
            modifiedBy: userId,
        });

        return repo.save(table);
    }

    static async updateTable(id: number, input: UpdateTableInput, userId: string): Promise<DiningTable> {
        const db = await initializeDatabase();
        const repo = db.getRepository(DiningTable);

        const table = await repo.findOne({ where: { id, deleted: false } });
        if (!table) throw new Error("Bàn không tồn tại");

        if (input.name !== undefined) table.name = input.name;
        if (input.area !== undefined) table.area = input.area;
        if (input.capacity !== undefined) table.capacity = input.capacity;
        if (input.isActive !== undefined) table.isActive = input.isActive;
        table.modifiedBy = userId;

        return repo.save(table);
    }

    static async updateLayout(positions: LayoutPosition[], userId: string): Promise<void> {
        const db = await initializeDatabase();
        const repo = db.getRepository(DiningTable);

        for (const pos of positions) {
            await repo.update(pos.id, {
                posX: pos.posX,
                posY: pos.posY,
                width: pos.width,
                height: pos.height,
                modifiedBy: userId,
            });
        }
    }

    static async deleteTable(id: number, userId: string): Promise<void> {
        const db = await initializeDatabase();
        const repo = db.getRepository(DiningTable);

        const table = await repo.findOne({ where: { id, deleted: false } });
        if (!table) throw new Error("Bàn không tồn tại");

        table.deleted = true;
        table.deletedAt = new Date();
        table.deletedBy = userId;
        await repo.save(table);
    }

    static async updateTableStatus(id: number, status: "empty" | "occupied"): Promise<void> {
        const db = await initializeDatabase();
        const repo = db.getRepository(DiningTable);
        await repo.update(id, { status });
    }

    static async listAreas(): Promise<string[]> {
        const db = await initializeDatabase();
        const repo = db.getRepository(DiningTable);
        const tables = await repo.find({
            select: ["area"],
            where: { deleted: false },
        });
        const areas = [...new Set(tables.map(t => t.area))];
        return areas.sort();
    }

    static async renameArea(oldName: string, newName: string, userId: string): Promise<void> {
        const db = await initializeDatabase();
        const repo = db.getRepository(DiningTable);
        await repo.update({ area: oldName, deleted: false }, {
            area: newName,
            modifiedBy: userId,
        });
    }
}
