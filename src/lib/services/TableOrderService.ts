import { initializeDatabase } from "../db/data-source";
import { TableOrder, TableOrderItem, DiningTable } from "../db/entities";
import { SequenceService } from "./SequenceService";
import { TableService } from "./TableService";
import { SalesService, CreateSalesInput } from "./SalesService";

export interface CreateTableOrderInput {
    tableId: number;
    notes?: string;
    items: {
        productId: number;
        quantity: number;
        unitPrice: number;
        notes?: string;
    }[];
}

export interface AddItemsInput {
    items: {
        productId: number;
        quantity: number;
        unitPrice: number;
        notes?: string;
    }[];
}

export class TableOrderService {
    /**
     * Create a new order for a table
     */
    static async createOrder(
        input: CreateTableOrderInput,
        userId: string
    ): Promise<TableOrder> {
        const db = await initializeDatabase();

        // Generate order number BEFORE the transaction to avoid nested transactions (SQLite limitation)
        const orderNumber = await SequenceService.getNextNumber(
            "table_order",
            new Date()
        );

        return await db.transaction(async (manager) => {
            const orderRepo = manager.getRepository(TableOrder);
            const itemRepo = manager.getRepository(TableOrderItem);
            const tableRepo = manager.getRepository(DiningTable);

            // Validate table exists
            const table = await tableRepo.findOne({
                where: { id: input.tableId, deleted: false },
            });
            if (!table) throw new Error("Bàn không tồn tại");

            // Calculate total
            let totalAmount = 0;
            const calculatedItems = input.items.map((item) => {
                const amount = item.quantity * item.unitPrice;
                totalAmount += amount;
                return { ...item, amount };
            });

            // Create order
            const order = orderRepo.create({
                orderNumber,
                tableId: input.tableId,
                status: "pending",
                totalAmount,
                notes: input.notes,
                createdBy: userId,
                modifiedBy: userId,
            });
            const savedOrder = await orderRepo.save(order);

            // Create items
            for (const item of calculatedItems) {
                const orderItem = itemRepo.create({
                    tableOrderId: savedOrder.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    amount: item.amount,
                    status: "pending",
                    notes: item.notes,
                    createdBy: userId,
                    modifiedBy: userId,
                });
                await itemRepo.save(orderItem);
            }

            // Update table status
            table.status = "occupied";
            await tableRepo.save(table);

            // Return with items
            return orderRepo.findOne({
                where: { id: savedOrder.id },
                relations: ["items", "items.product", "table"],
            }) as Promise<TableOrder>;
        });
    }

    /**
     * Add items to an existing order
     */
    static async addItems(
        orderId: number,
        input: AddItemsInput,
        userId: string
    ): Promise<TableOrder> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const orderRepo = manager.getRepository(TableOrder);
            const itemRepo = manager.getRepository(TableOrderItem);

            const order = await orderRepo.findOne({
                where: { id: orderId, deleted: false },
            });
            if (!order) throw new Error("Đơn hàng không tồn tại");
            if (order.status === "completed" || order.status === "cancelled") {
                throw new Error("Không thể thêm món vào đơn đã hoàn thành/hủy");
            }

            let addedAmount = 0;
            for (const item of input.items) {
                const amount = item.quantity * item.unitPrice;
                addedAmount += amount;
                const orderItem = itemRepo.create({
                    tableOrderId: orderId,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    amount,
                    status: "pending",
                    notes: item.notes,
                    createdBy: userId,
                    modifiedBy: userId,
                });
                await itemRepo.save(orderItem);
            }

            // Update total
            order.totalAmount = Number(order.totalAmount) + addedAmount;
            order.modifiedBy = userId;
            await orderRepo.save(order);

            return orderRepo.findOne({
                where: { id: orderId },
                relations: ["items", "items.product", "table"],
            }) as Promise<TableOrder>;
        });
    }

    /**
     * Update item status (for kitchen display)
     */
    static async updateItemStatus(
        itemId: number,
        status: "pending" | "preparing" | "done",
        userId: string
    ): Promise<TableOrderItem> {
        const db = await initializeDatabase();
        const repo = db.getRepository(TableOrderItem);

        const item = await repo.findOne({
            where: { id: itemId, deleted: false },
            relations: ["tableOrder"],
        });
        if (!item) throw new Error("Món không tồn tại");

        item.status = status;
        item.modifiedBy = userId;
        const savedItem = await repo.save(item);

        // Check if all items in the order are done → auto set order to preparing
        if (status === "preparing") {
            const orderRepo = db.getRepository(TableOrder);
            const order = await orderRepo.findOne({ where: { id: item.tableOrderId } });
            if (order && order.status === "pending") {
                order.status = "preparing";
                await orderRepo.save(order);
            }
        }

        return savedItem;
    }

    /**
     * Complete an order (checkout)
     */
    static async completeOrder(
        orderId: number,
        salesInput: CreateSalesInput,
        userId: string
    ): Promise<TableOrder> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const orderRepo = manager.getRepository(TableOrder);
            const order = await orderRepo.findOne({
                where: { id: orderId, deleted: false },
                relations: ["items"],
            });
            if (!order) throw new Error("Đơn hàng không tồn tại");

            // 1. Create sale record (this handles stock deduction)
            // Note: We use the items from the order as the basis for the sale
            const saleItems = order.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            }));

            await SalesService.createSale({
                ...salesInput,
                items: saleItems
            }, userId);

            // 2. Mark order as completed
            order.status = "completed";
            order.modifiedBy = userId;
            const savedOrder = await orderRepo.save(order);

            // 3. Free up the table
            await TableService.updateTableStatus(order.tableId, "empty");

            return savedOrder;
        });
    }

    /**
     * Cancel an order
     */
    static async cancelOrder(orderId: number, userId: string): Promise<TableOrder> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const orderRepo = manager.getRepository(TableOrder);
            const order = await orderRepo.findOne({
                where: { id: orderId, deleted: false },
            });
            if (!order) throw new Error("Đơn hàng không tồn tại");

            order.status = "cancelled";
            order.modifiedBy = userId;
            const savedOrder = await orderRepo.save(order);

            // Check if table has other active orders
            const activeOrders = await orderRepo.count({
                where: { tableId: order.tableId, deleted: false },
            });
            // Filter active: pending or preparing
            const reallyActive = await orderRepo
                .createQueryBuilder("o")
                .where("o.tableId = :tableId", { tableId: order.tableId })
                .andWhere("o.deleted = :deleted", { deleted: false })
                .andWhere("o.status IN (:...statuses)", {
                    statuses: ["pending", "preparing"],
                })
                .getCount();

            if (reallyActive === 0) {
                await TableService.updateTableStatus(order.tableId, "empty");
            }

            return savedOrder;
        });
    }

    /**
     * Get active orders (for kitchen display)
     */
    static async getActiveOrders(): Promise<TableOrder[]> {
        const db = await initializeDatabase();
        const repo = db.getRepository(TableOrder);

        return repo.find({
            where: [
                { status: "pending", deleted: false },
                { status: "preparing", deleted: false },
            ],
            relations: ["items", "items.product", "table"],
            order: { createdAt: "ASC" },
        });
    }

    /**
     * Get orders by table
     */
    static async getOrdersByTable(tableId: number): Promise<TableOrder[]> {
        const db = await initializeDatabase();
        const repo = db.getRepository(TableOrder);

        return repo.find({
            where: [
                { tableId, status: "pending", deleted: false },
                { tableId, status: "preparing", deleted: false },
            ],
            relations: ["items", "items.product"],
            order: { createdAt: "ASC" },
        });
    }

    /**
     * Get single order with details
     */
    static async getOrder(id: number): Promise<TableOrder | null> {
        const db = await initializeDatabase();
        const repo = db.getRepository(TableOrder);

        return repo.findOne({
            where: { id, deleted: false },
            relations: ["items", "items.product", "table"],
        });
    }

    /**
     * Merge items from one table order to another
     */
    static async mergeOrders(
        sourceOrderId: number,
        targetOrderId: number,
        userId: string
    ): Promise<TableOrder> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const orderRepo = manager.getRepository(TableOrder);
            const itemRepo = manager.getRepository(TableOrderItem);

            const sourceOrder = await orderRepo.findOne({
                where: { id: sourceOrderId, deleted: false },
                relations: ["items"],
            });
            const targetOrder = await orderRepo.findOne({
                where: { id: targetOrderId, deleted: false },
            });

            if (!sourceOrder || !targetOrder) {
                throw new Error("Một hoặc cả hai đơn hàng không tồn tại");
            }

            if (
                sourceOrder.status === "completed" ||
                sourceOrder.status === "cancelled" ||
                targetOrder.status === "completed" ||
                targetOrder.status === "cancelled"
            ) {
                throw new Error("Không thể gộp đơn đã hoàn thành hoặc đã hủy");
            }

            // Move all items
            for (const item of sourceOrder.items) {
                item.tableOrderId = targetOrderId;
                item.modifiedBy = userId;
                await itemRepo.save(item);
            }

            // Update target total
            targetOrder.totalAmount =
                Number(targetOrder.totalAmount) + Number(sourceOrder.totalAmount);
            targetOrder.modifiedBy = userId;
            await orderRepo.save(targetOrder);

            // Cancel/Close source order
            sourceOrder.status = "cancelled";
            sourceOrder.notes = (sourceOrder.notes || "") + ` [Gộp vào đơn ${targetOrder.orderNumber}]`;
            sourceOrder.modifiedBy = userId;
            await orderRepo.save(sourceOrder);

            // Free source table
            await TableService.updateTableStatus(sourceOrder.tableId, "empty");

            return orderRepo.findOne({
                where: { id: targetOrderId },
                relations: ["items", "items.product", "table"],
            }) as Promise<TableOrder>;
        });
    }

    /**
     * Move an entire order to a different table
     */
    static async moveOrder(
        orderId: number,
        targetTableId: number,
        userId: string
    ): Promise<TableOrder> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const orderRepo = manager.getRepository(TableOrder);
            const tableRepo = manager.getRepository(DiningTable);

            const order = await orderRepo.findOne({
                where: { id: orderId, deleted: false },
            });
            if (!order) throw new Error("Đơn hàng không tồn tại");

            const targetTable = await tableRepo.findOne({
                where: { id: targetTableId, deleted: false },
            });
            if (!targetTable) throw new Error("Bàn đích không tồn tại");
            if (targetTable.status === "occupied") {
                throw new Error("Bàn đích đang có khách, vui lòng sử dụng chức năng gộp bàn");
            }

            const oldTableId = order.tableId;

            // Move order
            order.tableId = targetTableId;
            order.modifiedBy = userId;
            await orderRepo.save(order);

            // Update table statuses
            await TableService.updateTableStatus(targetTableId, "occupied");
            await TableService.updateTableStatus(oldTableId, "empty");

            return orderRepo.findOne({
                where: { id: orderId },
                relations: ["items", "items.product", "table"],
            }) as Promise<TableOrder>;
        });
    }

    /**
     * Split items from an order to a new or existing table
     */
    static async splitOrder(
        sourceOrderId: number,
        targetTableId: number,
        itemsToMove: { itemId: number; quantity: number }[],
        userId: string
    ): Promise<TableOrder> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const orderRepo = manager.getRepository(TableOrder);
            const itemRepo = manager.getRepository(TableOrderItem);

            const sourceOrder = await orderRepo.findOne({
                where: { id: sourceOrderId, deleted: false },
                relations: ["items"],
            });
            if (!sourceOrder) throw new Error("Đơn hàng gốc không tồn tại");

            // Check or create target order
            let targetOrder = await orderRepo.findOne({
                where: { tableId: targetTableId, status: "pending", deleted: false },
            });

            if (!targetOrder) {
                // If target table matches existing pending/preparing, get it
                targetOrder = await orderRepo.createQueryBuilder("o")
                    .where("o.tableId = :tableId", { tableId: targetTableId })
                    .andWhere("o.status IN ('pending', 'preparing')")
                    .andWhere("o.deleted = false")
                    .getOne();
            }

            if (!targetOrder) {
                // Create a new order for the target table
                const orderNumber = await SequenceService.getNextNumber("table_order", new Date());
                targetOrder = orderRepo.create({
                    orderNumber,
                    tableId: targetTableId,
                    status: "pending",
                    totalAmount: 0,
                    createdBy: userId,
                    modifiedBy: userId,
                });
                await orderRepo.save(targetOrder);
                await TableService.updateTableStatus(targetTableId, "occupied");
            }

            let movedTotal = 0;

            for (const move of itemsToMove) {
                const item = await itemRepo.findOne({
                    where: { id: move.itemId, tableOrderId: sourceOrderId },
                    relations: ["product"]
                });
                if (!item) continue;

                const quantityToMove = Math.min(move.quantity, Number(item.quantity));
                if (quantityToMove <= 0) continue;

                const unitPrice = Number(item.unitPrice);
                const amountToMove = quantityToMove * unitPrice;

                if (quantityToMove === Number(item.quantity)) {
                    // Move the whole item record
                    item.tableOrderId = targetOrder.id;
                    item.modifiedBy = userId;
                    await itemRepo.save(item);
                } else {
                    // Move partial quantity: update old, create new
                    item.quantity = Number(item.quantity) - quantityToMove;
                    item.amount = Number(item.amount) - amountToMove;
                    item.modifiedBy = userId;
                    await itemRepo.save(item);

                    const newItem = itemRepo.create({
                        tableOrderId: targetOrder.id,
                        productId: item.productId,
                        quantity: quantityToMove,
                        unitPrice: unitPrice,
                        amount: amountToMove,
                        status: item.status,
                        notes: item.notes,
                        createdBy: userId,
                        modifiedBy: userId,
                    });
                    await itemRepo.save(newItem);
                }

                movedTotal += amountToMove;
            }

            // Update totals
            sourceOrder.totalAmount = Number(sourceOrder.totalAmount) - movedTotal;
            sourceOrder.modifiedBy = userId;
            await orderRepo.save(sourceOrder);

            targetOrder.totalAmount = Number(targetOrder.totalAmount) + movedTotal;
            targetOrder.modifiedBy = userId;
            await orderRepo.save(targetOrder);

            // If source order is now empty, consider cancelling or leaving it
            // Based on simple logic, we leave it if it still has items, otherwise we could cancel it.
            const remainingItemsCount = await itemRepo.count({ where: { tableOrderId: sourceOrderId, deleted: false } });
            if (remainingItemsCount === 0) {
                sourceOrder.status = "cancelled";
                sourceOrder.notes = (sourceOrder.notes || "") + " [Tất cả món đã được tách]";
                await orderRepo.save(sourceOrder);
                await TableService.updateTableStatus(sourceOrder.tableId, "empty");
            }

            return targetOrder;
        });
    }
}
