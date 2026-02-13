import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { Warehouse } from "./Warehouse";
import type { Supplier } from "./Supplier";
import type { GoodsReceiptDetail } from "./GoodsReceiptDetail";

export type GoodsReceiptStatus = "draft" | "confirmed" | "cancelled";

@Entity("goods_receipts")
export class GoodsReceipt extends BaseEntity {
    @Column({ name: "receipt_number", unique: true })
    receiptNumber!: string;

    @Column({ name: "invoice_number", nullable: true })
    invoiceNumber!: string;

    @Column({ name: "receipt_date", type: "datetime" })
    receiptDate!: Date;

    @Column({ name: "invoice_date", type: "datetime", nullable: true })
    invoiceDate!: Date;

    @Column({ name: "warehouse_id" })
    warehouseId!: number;

    @ManyToOne("Warehouse")
    @JoinColumn({ name: "warehouse_id" })
    warehouse!: Warehouse;

    @Column({ name: "supplier_id", nullable: true })
    supplierId!: number;

    @ManyToOne("Supplier")
    @JoinColumn({ name: "supplier_id" })
    supplier!: Supplier;

    @Column({ type: "text", nullable: true })
    notes!: string;

    @Column({ name: "total_amount", type: "decimal", precision: 18, scale: 2, default: 0 })
    totalAmount!: number;

    @Column({ name: "total_discount", type: "decimal", precision: 18, scale: 2, default: 0 })
    totalDiscount!: number;

    @Column({ name: "total_tax", type: "decimal", precision: 18, scale: 2, default: 0 })
    totalTax!: number;

    @Column({ name: "grand_total", type: "decimal", precision: 18, scale: 2, default: 0 })
    grandTotal!: number;

    @Column({ type: "varchar", length: 50, default: "draft" })
    status!: GoodsReceiptStatus;

    @OneToMany("GoodsReceiptDetail", "goodsReceipt")
    details!: GoodsReceiptDetail[];
}
