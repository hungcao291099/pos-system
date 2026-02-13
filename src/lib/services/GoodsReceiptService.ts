import { initializeDatabase } from "../db/data-source";
import {
    GoodsReceipt,
    GoodsReceiptDetail,
    GoodsReceiptStatus
} from "../db/entities";
import { StockBalanceService } from "./StockBalanceService";
import { SequenceService } from "./SequenceService";

export interface CreateGoodsReceiptInput {
    invoiceNumber?: string;
    receiptDate: Date;
    invoiceDate?: Date;
    warehouseId: number;
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

export interface GoodsReceiptFilter {
    warehouseId?: number;
    supplierId?: number;
    status?: GoodsReceiptStatus;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
}

export class GoodsReceiptService {
    /**
     * Create a new goods receipt (draft status)
     */
    static async createReceipt(
        input: CreateGoodsReceiptInput,
        userId: string
    ): Promise<GoodsReceipt> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const receiptRepo = manager.getRepository(GoodsReceipt);
            const detailRepo = manager.getRepository(GoodsReceiptDetail);

            // Generate receipt number
            const receiptNumber = await SequenceService.getNextNumber(
                "goods_receipt",
                input.receiptDate
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

            // Create receipt
            const receipt = receiptRepo.create({
                receiptNumber,
                invoiceNumber: input.invoiceNumber,
                receiptDate: input.receiptDate,
                invoiceDate: input.invoiceDate,
                warehouseId: input.warehouseId,
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

            const savedReceipt = await receiptRepo.save(receipt);

            // Create details
            for (const d of calculatedDetails) {
                const detail = detailRepo.create({
                    goodsReceiptId: savedReceipt.id,
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

            return savedReceipt;
        });
    }

    /**
     * Confirm a goods receipt - updates stock balance
     */
    static async confirmReceipt(id: number, userId: string): Promise<GoodsReceipt> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const receiptRepo = manager.getRepository(GoodsReceipt);
            const detailRepo = manager.getRepository(GoodsReceiptDetail);

            const receipt = await receiptRepo.findOne({
                where: { id, deleted: false },
            });

            if (!receipt) {
                throw new Error("Phiếu nhập không tồn tại");
            }

            if (receipt.status !== "draft") {
                throw new Error("Chỉ có thể xác nhận phiếu ở trạng thái nháp");
            }

            // Get details
            const details = await detailRepo.find({
                where: { goodsReceiptId: id, deleted: false },
            });

            // Update stock balance for each item
            for (const detail of details) {
                await StockBalanceService.updateStockBalance(
                    detail.productId,
                    receipt.warehouseId,
                    "in",
                    detail.quantity,
                    receipt.receiptDate
                );
            }

            // Update status
            receipt.status = "confirmed";
            receipt.modifiedBy = userId;
            return await receiptRepo.save(receipt);
        });
    }

    /**
     * Cancel a goods receipt - reverts stock if was confirmed
     */
    static async cancelReceipt(id: number, userId: string): Promise<GoodsReceipt> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const receiptRepo = manager.getRepository(GoodsReceipt);
            const detailRepo = manager.getRepository(GoodsReceiptDetail);

            const receipt = await receiptRepo.findOne({
                where: { id, deleted: false },
            });

            if (!receipt) {
                throw new Error("Phiếu nhập không tồn tại");
            }

            if (receipt.status === "cancelled") {
                throw new Error("Phiếu đã bị hủy");
            }

            // If was confirmed, revert stock
            if (receipt.status === "confirmed") {
                const details = await detailRepo.find({
                    where: { goodsReceiptId: id, deleted: false },
                });

                for (const detail of details) {
                    await StockBalanceService.updateStockBalance(
                        detail.productId,
                        receipt.warehouseId,
                        "out",
                        detail.quantity,
                        receipt.receiptDate
                    );
                }
            }

            receipt.status = "cancelled";
            receipt.modifiedBy = userId;
            return await receiptRepo.save(receipt);
        });
    }

    /**
     * Get receipt with full details
     */
    static async getReceiptWithDetails(id: number): Promise<GoodsReceipt | null> {
        const db = await initializeDatabase();
        const repo = db.getRepository(GoodsReceipt);

        return await repo.findOne({
            where: { id, deleted: false },
            relations: ["warehouse", "supplier", "details", "details.product", "details.unit"],
        });
    }

    /**
     * List receipts with filters and pagination
     */
    static async listReceipts(
        filter: GoodsReceiptFilter,
        page = 1,
        pageSize = 20
    ): Promise<{ items: GoodsReceipt[]; total: number }> {
        const db = await initializeDatabase();
        const repo = db.getRepository(GoodsReceipt);

        const qb = repo
            .createQueryBuilder("r")
            .leftJoinAndSelect("r.warehouse", "warehouse")
            .leftJoinAndSelect("r.supplier", "supplier")
            .where("r.deleted = :deleted", { deleted: false });

        if (filter.warehouseId) {
            qb.andWhere("r.warehouseId = :warehouseId", { warehouseId: filter.warehouseId });
        }
        if (filter.supplierId) {
            qb.andWhere("r.supplierId = :supplierId", { supplierId: filter.supplierId });
        }
        if (filter.status) {
            qb.andWhere("r.status = :status", { status: filter.status });
        }
        if (filter.fromDate) {
            qb.andWhere("r.receiptDate >= :fromDate", { fromDate: filter.fromDate });
        }
        if (filter.toDate) {
            qb.andWhere("r.receiptDate <= :toDate", { toDate: filter.toDate });
        }
        if (filter.search) {
            qb.andWhere("(r.receiptNumber LIKE :search OR r.invoiceNumber LIKE :search)", {
                search: `%${filter.search}%`,
            });
        }

        qb.orderBy("r.createdAt", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [items, total] = await qb.getManyAndCount();
        return { items, total };
    }
}
