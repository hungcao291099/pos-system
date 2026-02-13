import { initializeDatabase } from "../db/data-source";
import {
    SalesInvoice,
    SalesInvoiceDetail,
    PaymentMethod,
    Product,
    ProductWarehousePrice,
    ProductCategory
} from "../db/entities";
import { StockBalanceService } from "./StockBalanceService";
import { SequenceService } from "./SequenceService";

export interface CreateSalesInput {
    warehouseId: number;
    customerId?: number;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    transferCode?: string;
    notes?: string;
    items: {
        productId: number;
        quantity: number;
        unitPrice: number;
        discountAmount?: number;
        promotionId?: number;
    }[];
}

export interface SalesFilter {
    warehouseId?: number;
    customerId?: number;
    paymentMethod?: PaymentMethod;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
}

export interface ProductForSale {
    id: number;
    code: string;
    barcode?: string;
    name: string;
    unitId: number;
    unitName: string;
    categoryName: string;
    sellPrice: number;
    currentStock: number;
    isPreparation: boolean;
}

export class SalesService {
    /**
     * Create a sales invoice
     */
    static async createSale(
        input: CreateSalesInput,
        userId: string
    ): Promise<SalesInvoice> {
        const db = await initializeDatabase();

        // Validate payment method requirements
        if (input.paymentMethod === "credit" && !input.customerId) {
            throw new Error("Phải chọn khách hàng khi thanh toán ghi nợ");
        }
        if (input.paymentMethod === "transfer" && !input.transferCode) {
            throw new Error("Phải nhập mã giao dịch khi thanh toán chuyển khoản");
        }

        return await db.transaction(async (manager) => {
            const invoiceRepo = manager.getRepository(SalesInvoice);
            const detailRepo = manager.getRepository(SalesInvoiceDetail);

            // Validate stock availability (skip for preparation category products)
            const productRepo = manager.getRepository(Product);
            const categoryRepo = manager.getRepository(ProductCategory);
            for (const item of input.items) {
                const product = await productRepo.findOne({ where: { id: item.productId } });
                let isPrep = false;
                if (product?.categoryId) {
                    const cat = await categoryRepo.findOne({ where: { id: product.categoryId } });
                    isPrep = cat?.isPreparation || false;
                }
                if (!isPrep) {
                    const currentStock = await StockBalanceService.getCurrentStock(
                        item.productId,
                        input.warehouseId
                    );
                    if (currentStock < item.quantity) {
                        throw new Error(
                            `Không đủ tồn kho cho sản phẩm ID ${item.productId}. Tồn: ${currentStock}, Cần: ${item.quantity}`
                        );
                    }
                }
            }

            // Generate invoice number
            const invoiceNumber = await SequenceService.getNextNumber(
                "sales_invoice",
                new Date()
            );

            // Calculate total
            let totalAmount = 0;
            const calculatedItems = input.items.map((item) => {
                const amount = item.quantity * item.unitPrice;
                totalAmount += amount;
                return { ...item, amount };
            });

            // Calculate change for cash payment
            let changeAmount = 0;
            if (input.paymentMethod === "cash" && input.cashReceived) {
                changeAmount = input.cashReceived - totalAmount;
                if (changeAmount < 0) {
                    throw new Error("Tiền khách đưa không đủ");
                }
            }

            // Create invoice
            const invoice = invoiceRepo.create({
                invoiceNumber,
                invoiceDate: new Date(),
                warehouseId: input.warehouseId,
                customerId: input.customerId,
                paymentMethod: input.paymentMethod,
                cashReceived: input.cashReceived || 0,
                changeAmount,
                transferCode: input.transferCode,
                totalAmount,
                notes: input.notes,
                status: "completed",
                createdBy: userId,
                modifiedBy: userId,
            });

            const savedInvoice = await invoiceRepo.save(invoice);

            // Create details and update stock
            for (const item of calculatedItems) {
                const detail = detailRepo.create({
                    salesInvoiceId: savedInvoice.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    amount: item.amount,
                    discountAmount: item.discountAmount || 0,
                    promotionId: item.promotionId,
                    createdBy: userId,
                    modifiedBy: userId,
                });
                await detailRepo.save(detail);

                // Decrease stock
                await StockBalanceService.updateStockBalance(
                    item.productId,
                    input.warehouseId,
                    "sold",
                    item.quantity,
                    new Date()
                );
            }

            return savedInvoice;
        });
    }

    /**
     * Get products available for sale in a warehouse
     * Returns products with stock > 0 and their warehouse-specific prices
     */
    static async getProductsForSale(warehouseId: number): Promise<ProductForSale[]> {
        const db = await initializeDatabase();
        const productRepo = db.getRepository(Product);
        const priceRepo = db.getRepository(ProductWarehousePrice);
        const categoryRepo = db.getRepository(ProductCategory);

        // Get all active products with unit and category
        const products = await productRepo.find({
            where: { isActive: true, deleted: false },
            relations: ["unit"],
        });

        const result: ProductForSale[] = [];

        for (const product of products) {
            // Check if category is preparation type
            let isPreparation = false;
            let categoryName = "";
            if (product.categoryId) {
                const category = await categoryRepo.findOne({ where: { id: product.categoryId } });
                isPreparation = category?.isPreparation || false;
                categoryName = category?.name || "";
            }

            // Get current stock
            const currentStock = await StockBalanceService.getCurrentStock(
                product.id,
                warehouseId
            );

            // Get warehouse-specific price or default
            const warehousePrice = await priceRepo.findOne({
                where: { productId: product.id, warehouseId, isActive: true },
            });

            const sellPrice = warehousePrice
                ? Number(warehousePrice.sellPrice)
                : Number(product.defaultSellPrice);

            result.push({
                id: product.id,
                code: product.code,
                barcode: product.barcode || undefined,
                name: product.name,
                unitId: product.unitId,
                unitName: product.unit?.name || "",
                categoryName,
                sellPrice,
                currentStock,
                isPreparation,
            });
        }

        return result;
    }

    /**
     * Cancel a sales invoice
     */
    static async cancelSale(id: number, userId: string): Promise<SalesInvoice> {
        const db = await initializeDatabase();

        return await db.transaction(async (manager) => {
            const invoiceRepo = manager.getRepository(SalesInvoice);
            const detailRepo = manager.getRepository(SalesInvoiceDetail);

            const invoice = await invoiceRepo.findOne({
                where: { id, deleted: false },
            });

            if (!invoice) {
                throw new Error("Hóa đơn không tồn tại");
            }

            if (invoice.status === "cancelled") {
                throw new Error("Hóa đơn đã bị hủy");
            }

            // Revert stock
            const details = await detailRepo.find({
                where: { salesInvoiceId: id, deleted: false },
            });

            for (const detail of details) {
                // Add back to stock (negative sold)
                await StockBalanceService.updateStockBalance(
                    detail.productId,
                    invoice.warehouseId,
                    "in",
                    Number(detail.quantity),
                    invoice.invoiceDate
                );
            }

            invoice.status = "cancelled";
            invoice.modifiedBy = userId;
            return await invoiceRepo.save(invoice);
        });
    }

    /**
     * Get invoice with full details
     */
    static async getInvoiceWithDetails(id: number): Promise<SalesInvoice | null> {
        const db = await initializeDatabase();
        const repo = db.getRepository(SalesInvoice);

        return await repo.findOne({
            where: { id, deleted: false },
            relations: ["warehouse", "customer", "details", "details.product"],
        });
    }

    /**
     * List invoices with filters and pagination
     */
    static async listInvoices(
        filter: SalesFilter,
        page = 1,
        pageSize = 20
    ): Promise<{ items: SalesInvoice[]; total: number }> {
        const db = await initializeDatabase();
        const repo = db.getRepository(SalesInvoice);

        const qb = repo
            .createQueryBuilder("i")
            .leftJoinAndSelect("i.warehouse", "warehouse")
            .leftJoinAndSelect("i.customer", "customer")
            .where("i.deleted = :deleted", { deleted: false });

        if (filter.warehouseId) {
            qb.andWhere("i.warehouseId = :warehouseId", { warehouseId: filter.warehouseId });
        }
        if (filter.customerId) {
            qb.andWhere("i.customerId = :customerId", { customerId: filter.customerId });
        }
        if (filter.paymentMethod) {
            qb.andWhere("i.paymentMethod = :paymentMethod", {
                paymentMethod: filter.paymentMethod,
            });
        }
        if (filter.fromDate) {
            qb.andWhere("i.invoiceDate >= :fromDate", { fromDate: filter.fromDate });
        }
        if (filter.toDate) {
            qb.andWhere("i.invoiceDate <= :toDate", { toDate: filter.toDate });
        }
        if (filter.search) {
            qb.andWhere("i.invoiceNumber LIKE :search", {
                search: `%${filter.search}%`,
            });
        }

        qb.orderBy("i.createdAt", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize);

        const [items, total] = await qb.getManyAndCount();
        return { items, total };
    }
}
