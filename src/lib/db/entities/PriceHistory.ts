import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Product } from "./Product";
import { Warehouse } from "./Warehouse";

@Entity("price_histories")
export class PriceHistory extends BaseEntity {
    @Column({ name: "product_id" })
    productId!: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column({ name: "warehouse_id", type: "integer", nullable: true })
    warehouseId?: number | null;

    @ManyToOne(() => Warehouse)
    @JoinColumn({ name: "warehouse_id" })
    warehouse!: Warehouse;

    @Column({ name: "old_price", type: "decimal", precision: 18, scale: 2 })
    oldPrice!: number;

    @Column({ name: "new_price", type: "decimal", precision: 18, scale: 2 })
    newPrice!: number;

    @Column({ name: "price_type" })
    priceType!: string; // 'purchase' | 'sell'

    @Column({ name: "effective_date", type: "datetime" })
    effectiveDate!: Date;

    @Column({ nullable: true, type: "text" })
    reason!: string;
}
