import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { Warehouse } from "./Warehouse";
import type { Supplier } from "./Supplier";
import type { StockOutDetail } from "./StockOutDetail";

export type StockOutType = "return" | "transfer" | "adjustment";
export type StockOutStatus = "draft" | "confirmed" | "cancelled";

@Entity("stock_outs")
export class StockOut extends BaseEntity {
    @Column({ name: "out_number", unique: true })
    outNumber!: string;

    @Column({ name: "out_date", type: "datetime" })
    outDate!: Date;

    @Column({ name: "out_type", type: "varchar", length: 50 })
    outType!: StockOutType;

    @Column({ name: "from_warehouse_id" })
    fromWarehouseId!: number;

    @ManyToOne("Warehouse")
    @JoinColumn({ name: "from_warehouse_id" })
    fromWarehouse!: Warehouse;

    @Column({ name: "to_warehouse_id", nullable: true })
    toWarehouseId!: number;

    @ManyToOne("Warehouse")
    @JoinColumn({ name: "to_warehouse_id" })
    toWarehouse!: Warehouse;

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
    status!: StockOutStatus;

    @OneToMany("StockOutDetail", "stockOut")
    details!: StockOutDetail[];
}
