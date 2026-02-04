import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { Unit } from "./Unit";
import type { ProductCategory } from "./ProductCategory";
import type { ProductWarehousePrice } from "./ProductWarehousePrice";

@Entity("products")
export class Product extends BaseEntity {
    @Column({ unique: true })
    code!: string;

    @Column({ nullable: true })
    barcode!: string;

    @Column()
    name!: string;

    @Column({ nullable: true, type: "text" })
    description!: string;

    @Column({ name: "unit_id" })
    unitId!: number;

    @ManyToOne("Unit")
    @JoinColumn({ name: "unit_id" })
    unit!: Unit;

    @Column({ name: "category_id", nullable: true })
    categoryId!: number;

    @ManyToOne("ProductCategory")
    @JoinColumn({ name: "category_id" })
    category!: ProductCategory;

    @Column({ name: "purchase_price", type: "decimal", precision: 18, scale: 2, default: 0 })
    purchasePrice!: number;

    @Column({ name: "default_sell_price", type: "decimal", precision: 18, scale: 2, default: 0 })
    defaultSellPrice!: number;

    @Column({ name: "min_stock", type: "decimal", precision: 18, scale: 2, default: 0 })
    minStock!: number;

    @Column({ name: "max_stock", type: "decimal", precision: 18, scale: 2, nullable: true })
    maxStock!: number;

    @Column({ nullable: true })
    image!: string;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @OneToMany("ProductWarehousePrice", "product")
    warehousePrices!: ProductWarehousePrice[];
}
