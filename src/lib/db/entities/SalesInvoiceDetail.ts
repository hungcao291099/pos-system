import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { SalesInvoice } from "./SalesInvoice";
import { Product } from "./Product";
import type { PromotionPolicy } from "./PromotionPolicy";

@Entity("sales_invoice_details")
export class SalesInvoiceDetail extends BaseEntity {
    @Column({ name: "sales_invoice_id" })
    salesInvoiceId!: number;

    @ManyToOne("SalesInvoice", "details", { onDelete: "CASCADE" })
    @JoinColumn({ name: "sales_invoice_id" })
    salesInvoice!: SalesInvoice;

    @Column({ name: "product_id" })
    productId!: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column({ type: "decimal", precision: 18, scale: 4, default: 0 })
    quantity!: number;

    @Column({ name: "unit_price", type: "decimal", precision: 18, scale: 2, default: 0 })
    unitPrice!: number;

    @Column({ type: "decimal", precision: 18, scale: 2, default: 0 })
    amount!: number;

    @Column({ name: "discount_amount", type: "decimal", precision: 18, scale: 2, default: 0 })
    discountAmount!: number;

    @Column({ name: "promotion_id", type: "integer", nullable: true })
    promotionId?: number | null;

    @ManyToOne("PromotionPolicy")
    @JoinColumn({ name: "promotion_id" })
    promotion!: PromotionPolicy;
}
