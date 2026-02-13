import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { StockPeriod } from "./StockPeriod";
import { Product } from "./Product";
import { Warehouse } from "./Warehouse";

@Entity("stock_balances")
@Unique(["periodId", "productId", "warehouseId"])
export class StockBalance extends BaseEntity {
    @Column({ name: "period_id" })
    periodId!: number;

    @ManyToOne(() => StockPeriod)
    @JoinColumn({ name: "period_id" })
    period!: StockPeriod;

    @Column({ name: "product_id" })
    productId!: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column({ name: "warehouse_id" })
    warehouseId!: number;

    @ManyToOne(() => Warehouse)
    @JoinColumn({ name: "warehouse_id" })
    warehouse!: Warehouse;

    @Column({ name: "opening_qty", type: "decimal", precision: 18, scale: 4, default: 0 })
    openingQty!: number;

    @Column({ name: "in_qty", type: "decimal", precision: 18, scale: 4, default: 0 })
    inQty!: number;

    @Column({ name: "out_qty", type: "decimal", precision: 18, scale: 4, default: 0 })
    outQty!: number;

    @Column({ name: "sold_qty", type: "decimal", precision: 18, scale: 4, default: 0 })
    soldQty!: number;

    @Column({ name: "closing_qty", type: "decimal", precision: 18, scale: 4, default: 0 })
    closingQty!: number;
}
