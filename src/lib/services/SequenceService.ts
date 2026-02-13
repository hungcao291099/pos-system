import { initializeDatabase } from "../db/data-source";
import { Sequence, SequenceType } from "../db/entities/Sequence";

const PREFIXES: Record<SequenceType, string> = {
    goods_receipt: "NH",
    stock_out: "XK",
    sales_invoice: "HD",
    table_order: "OD",
};

export class SequenceService {
    /**
     * Generate next document number with format: {prefix}/{yyMM}/{number:04d}
     * Uses transaction to prevent duplicate numbers
     */
    static async getNextNumber(type: SequenceType, date: Date = new Date()): Promise<string> {
        const db = await initializeDatabase();
        const yearMonth = this.formatYearMonth(date);
        const prefix = PREFIXES[type];

        return await db.transaction(async (manager) => {
            const repo = manager.getRepository(Sequence);

            // Try to find existing sequence for this type and period
            // Note: SQLite doesn't support pessimistic_write locks, using simple transaction
            let sequence = await repo.findOne({
                where: { type, yearMonth },
            });

            if (!sequence) {
                // Create new sequence for this period
                sequence = repo.create({
                    type,
                    prefix,
                    yearMonth,
                    lastNumber: 0,
                    createdBy: "system",
                    modifiedBy: "system",
                });
            }

            // Increment and save
            sequence.lastNumber += 1;
            sequence.modifiedBy = "system";
            await repo.save(sequence);

            // Format: NH/2602/0001
            return `${prefix}/${yearMonth}/${sequence.lastNumber.toString().padStart(4, "0")}`;
        });
    }

    /**
     * Get current last number without incrementing (for display)
     */
    static async getCurrentNumber(type: SequenceType, date: Date = new Date()): Promise<number> {
        const db = await initializeDatabase();
        const yearMonth = this.formatYearMonth(date);
        const repo = db.getRepository(Sequence);

        const sequence = await repo.findOne({
            where: { type, yearMonth },
        });

        return sequence?.lastNumber || 0;
    }

    /**
     * Format date to yyMM string
     */
    private static formatYearMonth(date: Date): string {
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        return `${year}${month}`;
    }
}
