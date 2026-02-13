import { initializeDatabase } from "../db/data-source";
import {
    StockOut,
    StockOutDetail,
    StockOutType,
    StockOutStatus,
    GoodsReceipt,
    GoodsReceiptDetail
} from "../db/entities";
import { StockBalanceService } from "./StockBalanceService";
import { SequenceService } from "./SequenceService";

export interface CreateStockOutInput {
    outDate: Date;
    outType: StockOutType;
    fromWarehouseId: number;
    toWarehouseId?: number;
    supplierId?: number;
    notes?: string;
    details: {
        productId: number;
        unitId: number;
        quantity: number;
        unitPrice: number;
        discountPercent?: number;
        discountAmount?: number;
        taxPercent?: number;
    }[];
}

export interface StockOutFilter {
    fromWarehouseId?: number;
    outType?: StockOutType;
    status?: StockOutStatus;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
}

export class StockOutService {
    /**
     * Create a new stock out (draft status)
     */
    static async createStockOut(
        input: CreateStockOutInput,
        userId: string
    ): Promise<StockOut> {
        const db = await initializeDatabase();

        // Validate transfer type
        if (input.outType === "transfer" && !input.toWarehouseId) {
            throw new Error("Phải chọn kho đích khi xuất chuyển kho");
        }
        if (input.outType === "return" && !input.supplierId) {
            throw new Error("Phải chọn nhà cung cấp khi xuất trả hàng");
        }

        return await db.transaction(async (manager) => {
            const stockOutRepo = manager.getRepository(StockOut);
            const detailRepo = manager.getRepository(StockOutDetail);

            // Generate out number
            const outNumber = await SequenceService.getNextNumber(
                "stock_out",
                input.outDate
            );

            // Calculate totals
            let totalAmount = 0;
            let totalDiscount = 0;
            let totalTax = 0;

            const calculatedDetails = input.details.map((d) => {
                const amount = d.quantity * d.unitPrice;
                const discountAmt = d.discountAmount || (amount * (d.discountPercent || 0)) / 100;
                const amountAfterDiscount = amount - discountAmt;
                const taxAmt = (amountAfterDiscount * (d.taxPercent || 0)) / 100;
                const total = amountAfterDiscount + taxAmt;

                totalAmount += amount;
                totalDiscount += discountAmt;
                totalTax += taxAmt;

                return {
                    ...d,
                    amount,
                    discountAmount: discountAmt,
                    amountAfterDiscount,
                    taxAmount: taxAmt,
                    totalAmount: total,
                };
            });

            const grandTotal = totalAmount - totalDiscount + totalTax;

            // Create stock out
            const stockOut = stockOutRepo.create({
                outNumber,
                outDate: input.outDate,
                outType: input.outType,
                fromWarehouseId: input.fromWarehouseId,
                toWarehouseId: input.toWarehouseId,
                supplierId: input.supplierId,
                notes: input.notes,
                totalAmount,
                totalDiscount,
                totalTax,
                grandTotal,
                status: "draft",
                createdBy: userId,
                modifiedBy: userId,
            });

            const savedStockOut = await stockOutRepo.save(stockOut);

            // Create details
            for (const d of calculatedDetails) {
                const detail = detailRepo.create({
                    stockOutId: savedStockOut.id,
                    productId: d.productId,
                    unitId: d.unitId,
                    quantity: d.quantity,
                    unitPrice: d.unitPrice,
                    amount: d.amount,
                    discountPercent: d.discountPercent || 0,
                    discountAmount: d.discountAmount,
                    amountAfterDiscount: d.amountAfterDiscount,
                    taxPercent: d.taxPercent || 0,
                    taxAmount: d.taxAmount,
                    totalAmount: d.totalAmount,
                    createdBy: userId,
                    modifiedBy: userId,
                });
                await detailRepo.save(detail);
            }

            return savedStockOut;
        });
    }

    /**
     * Confirm stock out - updates stock balances
     * For transfers, also creates inbound to destination warehouse
     */
    static async confirmStockOut(id: number, userId: string): Promise<StockOut> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const stockOutRepo = manager.getRepository(StockOut);
            const detailRepo = manager.getRepository(StockOutDetail);

            const stockOut = await stockOutRepo.findOne({
                where: { id, deleted: false },
            });

            if (!stockOut) {
                throw new Error("Phiếu xuất không tồn tại");
            }

            if (stockOut.status !== "draft") {
                throw new Error("Chỉ có thể xác nhận phiếu ở trạng thái nháp");
            }

            const details = await detailRepo.find({
                where: { stockOutId: id, deleted: false },
            });

            // Validate stock availability
            for (const detail of details) {
                const currentStock = await StockBalanceService.getCurrentStock(
                    detail.productId,
                    stockOut.fromWarehouseId
                );
                if (currentStock < Number(detail.quantity)) {
                    throw new Error(
                        `Không đủ tồn kho cho sản phẩm ID ${detail.productId}. Tồn: ${currentStock}, Cần: ${detail.quantity}`
                    );
                }
            }

            // Decrease stock from source warehouse
            for (const detail of details) {
                await StockBalanceService.updateStockBalance(
                    detail.productId,
                    stockOut.fromWarehouseId,
                    "out",
                    Number(detail.quantity),
                    stockOut.outDate
                );
            }

            // If transfer, increase stock in destination warehouse
            if (stockOut.outType === "transfer" && stockOut.toWarehouseId) {
                for (const detail of details) {
                    await StockBalanceService.updateStockBalance(
                        detail.productId,
                        stockOut.toWarehouseId,
                        "in",
                        Number(detail.quantity),
                        stockOut.outDate
                    );
                }
            }

            stockOut.status = "confirmed";
            stockOut.modifiedBy = userId;
            return await stockOutRepo.save(stockOut);
        });
    }

    /**
     * Cancel stock out - reverts stock if was confirmed
     */
    static async cancelStockOut(id: number, userId: string): Promise<StockOut> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const stockOutRepo = manager.getRepository(StockOut);
            const detailRepo = manager.getRepository(StockOutDetail);

            const stockOut = await stockOutRepo.findOne({
                where: { id, deleted: false },
            });

            if (!stockOut) {
                throw new Error("Phiếu xuất không tồn tại");
            }

            if (stockOut.status === "cancelled") {
                throw new Error("Phiếu đã bị hủy");
            }

            // If was confirmed, revert stock
            if (stockOut.status === "confirmed") {
                const details = await detailRepo.find({
                    where: { stockOutId: id, deleted: false },
                });

                // Add back to source warehouse
                for (const detail of details) {
                    await StockBalanceService.updateStockBalance(
                        detail.productId,
                        stockOut.fromWarehouseId,
                        "in",
                        Number(detail.quantity),
                        stockOut.outDate
                    );
                }

                // If transfer, remove from destination warehouse
                if (stockOut.outType === "transfer" && stockOut.toWarehouseId) {
                    for (const detail of details) {
                        await StockBalanceService.updateStockBalance(
                            detail.productId,
                            stockOut.toWarehouseId,
                            "out",
                            Number(detail.quantity),
                            stockOut.outDate
                        );
                    }
                }
            }

            stockOut.status = "cancelled";
            stockOut.modifiedBy = userId;
            return await stockOutRepo.save(stockOut);
        });
    }

    /**
     * Get stock out with full details
     */
    static async getStockOutWithDetails(id: number): Promise<StockOut | null> {
        const db = await initializeDatabase();
        const repo = db.getRepository(StockOut);

        return await repo.findOne({
            where: { id, deleted: false },
            relations: [
                "fromWarehouse",
                "toWarehouse",
                "supplier",
                "details",
                "details.product",
                "details.unit",
            ],
        });
    }

    /**
     * List stock outs with filters and pagination
     */
    static async listStockOuts(
        filter: StockOutFilter,
        page = 1,
        pageSize = 20
    ): Promise<{ items: StockOut[]; total: number }> {
        const db = await initializeDatabase();
        const repo = db.getRepository(StockOut);

        const qb = repo
            .createQueryBuilder("s")
            .leftJoinAndSelect("s.fromWarehouse", "fromWarehouse")
            .leftJoinAndSelect("s.toWarehouse", "toWarehouse")
            .leftJoinAndSelect("s.supplier", "supplier")
            .where("s.deleted = :deleted", { deleted: false });

        if (filter.fromWarehouseId) {
            qb.andWhere("s.fromWarehouseId = :fromWarehouseId", {
                fromWarehouseId: filter.fromWarehouseId,
            });
        }
        if (filter.outType) {
            qb.andWhere("s.outType = :outType", { outType: filter.outType });
        }
        if (filter.status) {
            qb.andWhere("s.status = :status", { status: filter.status });
        }
        if (filter.fromDate) {
            qb.andWhere("s.outDate >= :fromDate", { fromDate: filter.fromDate });
        }
        if (filter.toDate) {
            qb.andWhere("s.outDate <= :toDate", { toDate: filter.toDate });
        }
        if (filter.search) {
            qb.andWhere("s.outNumber LIKE :search", {
                search: `%${filter.search}%`,
            });
        }

        qb.orderBy("s.createdAt", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [items, total] = await qb.getManyAndCount();
        return { items, total };
    }
}
