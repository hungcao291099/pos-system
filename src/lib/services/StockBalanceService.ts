import { initializeDatabase } from "../db/data-source";
import { StockBalance, StockPeriod } from "../db/entities";

export type StockChangeType = "in" | "out" | "sold";

export class StockBalanceService {
    /**
     * Update stock balance for a product in a warehouse
     */
    static async updateStockBalance(
        productId: number,
        warehouseId: number,
        changeType: StockChangeType,
        quantity: number,
        transactionDate: Date = new Date()
    ): Promise<void> {
        const db = await initializeDatabase();

        await db.transaction(async (manager) => {
            const periodRepo = manager.getRepository(StockPeriod);
            const balanceRepo = manager.getRepository(StockBalance);

            // Get or create current period
            const periodCode = this.formatPeriodCode(transactionDate);
            let period = await periodRepo.findOne({
                where: { periodCode, warehouseId },
            });

            if (!period) {
                // Create new period
                const { startDate, endDate } = this.getPeriodDates(transactionDate);
                period = periodRepo.create({
                    periodCode,
                    warehouseId,
                    startDate,
                    endDate,
                    isClosed: false,
                    createdBy: "system",
                    modifiedBy: "system",
                });
                await periodRepo.save(period);
            }

            if (period.isClosed) {
                throw new Error(`Kỳ ${periodCode} đã chốt, không thể thực hiện giao dịch`);
            }

            // Get or create stock balance
            let balance = await balanceRepo.findOne({
                where: { periodId: period.id, productId, warehouseId },
            });

            if (!balance) {
                // Get opening qty from previous period
                const openingQty = await this.getClosingQtyFromPreviousPeriod(
                    productId,
                    warehouseId,
                    transactionDate
                );

                balance = balanceRepo.create({
                    periodId: period.id,
                    productId,
                    warehouseId,
                    openingQty,
                    inQty: 0,
                    outQty: 0,
                    soldQty: 0,
                    closingQty: openingQty,
                    createdBy: "system",
                    modifiedBy: "system",
                });
            }

            // Update quantities based on change type
            switch (changeType) {
                case "in":
                    balance.inQty = Number(balance.inQty) + quantity;
                    break;
                case "out":
                    balance.outQty = Number(balance.outQty) + quantity;
                    break;
                case "sold":
                    balance.soldQty = Number(balance.soldQty) + quantity;
                    break;
            }

            // Recalculate closing qty
            balance.closingQty =
                Number(balance.openingQty) +
                Number(balance.inQty) -
                Number(balance.outQty) -
                Number(balance.soldQty);

            balance.modifiedBy = "system";
            await balanceRepo.save(balance);
        });
    }

    /**
     * Get current stock for a product in a warehouse
     */
    static async getCurrentStock(productId: number, warehouseId: number): Promise<number> {
        const db = await initializeDatabase();
        const balanceRepo = db.getRepository(StockBalance);
        const periodRepo = db.getRepository(StockPeriod);

        // Get latest period for warehouse
        const latestPeriod = await periodRepo.findOne({
            where: { warehouseId },
            order: { periodCode: "DESC" },
        });

        if (!latestPeriod) {
            return 0;
        }

        const balance = await balanceRepo.findOne({
            where: { periodId: latestPeriod.id, productId, warehouseId },
        });

        return balance ? Number(balance.closingQty) : 0;
    }

    /**
     * Get stock balances for a warehouse in current period
     */
    static async getStockByWarehouse(
        warehouseId: number,
        periodCode?: string
    ): Promise<StockBalance[]> {
        const db = await initializeDatabase();
        const periodRepo = db.getRepository(StockPeriod);
        const balanceRepo = db.getRepository(StockBalance);

        let period: StockPeriod | null;
        if (periodCode) {
            period = await periodRepo.findOne({ where: { periodCode, warehouseId } });
        } else {
            period = await periodRepo.findOne({
                where: { warehouseId },
                order: { periodCode: "DESC" },
            });
        }

        if (!period) {
            return [];
        }

        return await balanceRepo.find({
            where: { periodId: period.id },
            relations: ["product", "product.unit"],
        });
    }

    /**
     * Close a period and create next period
     */
    static async closePeriod(
        warehouseId: number,
        periodCode: string,
        userId: string
    ): Promise<StockPeriod> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const periodRepo = manager.getRepository(StockPeriod);
            const balanceRepo = manager.getRepository(StockBalance);

            const period = await periodRepo.findOne({
                where: { periodCode, warehouseId },
            });

            if (!period) {
                throw new Error("Kỳ không tồn tại");
            }

            if (period.isClosed) {
                throw new Error("Kỳ đã được chốt trước đó");
            }

            // Close current period
            period.isClosed = true;
            period.closedAt = new Date();
            period.closedBy = userId;
            await periodRepo.save(period);

            // Get all balances for this period
            const balances = await balanceRepo.find({
                where: { periodId: period.id },
            });

            // Create next period
            const nextDate = new Date(period.endDate);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextPeriodCode = this.formatPeriodCode(nextDate);
            const { startDate, endDate } = this.getPeriodDates(nextDate);

            const nextPeriod = periodRepo.create({
                periodCode: nextPeriodCode,
                warehouseId,
                startDate,
                endDate,
                isClosed: false,
                createdBy: userId,
                modifiedBy: userId,
            });
            await periodRepo.save(nextPeriod);

            // Create opening balances for next period
            for (const balance of balances) {
                if (Number(balance.closingQty) !== 0) {
                    const nextBalance = balanceRepo.create({
                        periodId: nextPeriod.id,
                        productId: balance.productId,
                        warehouseId: balance.warehouseId,
                        openingQty: balance.closingQty,
                        inQty: 0,
                        outQty: 0,
                        soldQty: 0,
                        closingQty: balance.closingQty,
                        createdBy: userId,
                        modifiedBy: userId,
                    });
                    await balanceRepo.save(nextBalance);
                }
            }

            return nextPeriod;
        });
    }

    /**
     * Recalculate stock balances from transactions
     */
    static async recalculateStock(
        warehouseId: number,
        periodCode: string
    ): Promise<void> {
        const db = await initializeDatabase();
        const periodRepo = db.getRepository(StockPeriod);

        const period = await periodRepo.findOne({
            where: { periodCode, warehouseId },
        });

        if (!period) {
            throw new Error("Kỳ không tồn tại");
        }

        if (period.isClosed) {
            throw new Error("Không thể tính lại tồn kho cho kỳ đã chốt");
        }

        // TODO: Implement full recalculation from GoodsReceipt, StockOut, SalesInvoice
        // This is a complex operation that requires querying all transactions
        // For now, this is a placeholder
    }

    /**
     * Get closing qty from previous period
     */
    private static async getClosingQtyFromPreviousPeriod(
        productId: number,
        warehouseId: number,
        currentDate: Date
    ): Promise<number> {
        const db = await initializeDatabase();
        const periodRepo = db.getRepository(StockPeriod);
        const balanceRepo = db.getRepository(StockBalance);

        const currentPeriodCode = this.formatPeriodCode(currentDate);

        // Find previous period
        const previousPeriod = await periodRepo
            .createQueryBuilder("p")
            .where("p.warehouseId = :warehouseId", { warehouseId })
            .andWhere("p.periodCode < :currentPeriodCode", { currentPeriodCode })
            .orderBy("p.periodCode", "DESC")
            .getOne();

        if (!previousPeriod) {
            return 0;
        }

        const balance = await balanceRepo.findOne({
            where: { periodId: previousPeriod.id, productId, warehouseId },
        });

        return balance ? Number(balance.closingQty) : 0;
    }

    /**
     * Format date to period code (yyyyMM)
     */
    private static formatPeriodCode(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        return `${year}-${month}`;
    }

    /**
     * Get start and end dates for a period
     */
    private static getPeriodDates(date: Date): { startDate: Date; endDate: Date } {
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        return { startDate, endDate };
    }
}
