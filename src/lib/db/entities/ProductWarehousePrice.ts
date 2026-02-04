import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { Product } from "./Product";
import type { Warehouse } from "./Warehouse";

@Entity("product_warehouse_prices")
@Unique(["productId", "warehouseId"])
export class ProductWarehousePrice extends BaseEntity {
    @Column({ name: "product_id" })
    productId!: number;

    @ManyToOne("Product", "warehousePrices")
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column({ name: "warehouse_id" })
    warehouseId!: number;

    @ManyToOne("Warehouse")
    @JoinColumn({ name: "warehouse_id" })
    warehouse!: Warehouse;

    @Column({ name: "sell_price", type: "decimal", precision: 18, scale: 2, default: 0 })
    sellPrice!: number;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;
}
