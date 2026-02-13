import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { StockOut } from "./StockOut";
import type { Product } from "./Product";
import type { Unit } from "./Unit";

@Entity("stock_out_details")
export class StockOutDetail extends BaseEntity {
    @Column({ name: "stock_out_id" })
    stockOutId!: number;

    @ManyToOne("StockOut", "details", { onDelete: "CASCADE" })
    @JoinColumn({ name: "stock_out_id" })
    stockOut!: StockOut;

    @Column({ name: "product_id" })
    productId!: number;

    @ManyToOne("Product")
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column({ name: "unit_id" })
    unitId!: number;

    @ManyToOne("Unit")
    @JoinColumn({ name: "unit_id" })
    unit!: Unit;

    @Column({ type: "decimal", precision: 18, scale: 4, default: 0 })
    quantity!: number;

    @Column({ name: "unit_price", type: "decimal", precision: 18, scale: 2, default: 0 })
    unitPrice!: number;

    @Column({ type: "decimal", precision: 18, scale: 2, default: 0 })
    amount!: number;

    @Column({ name: "discount_percent", type: "decimal", precision: 5, scale: 2, default: 0 })
    discountPercent!: number;

    @Column({ name: "discount_amount", type: "decimal", precision: 18, scale: 2, default: 0 })
    discountAmount!: number;

    @Column({ name: "amount_after_discount", type: "decimal", precision: 18, scale: 2, default: 0 })
    amountAfterDiscount!: number;

    @Column({ name: "tax_percent", type: "decimal", precision: 5, scale: 2, default: 0 })
    taxPercent!: number;

    @Column({ name: "tax_amount", type: "decimal", precision: 18, scale: 2, default: 0 })
    taxAmount!: number;

    @Column({ name: "total_amount", type: "decimal", precision: 18, scale: 2, default: 0 })
    totalAmount!: number;
}
