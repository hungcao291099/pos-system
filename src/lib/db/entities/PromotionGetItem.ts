import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { PromotionPolicy } from "./PromotionPolicy";
import { Product } from "./Product";

@Entity("promotion_get_items")
export class PromotionGetItem extends BaseEntity {
    @Column({ name: "promotion_id" })
    promotionId!: number;

    @ManyToOne("PromotionPolicy", "getItems")
    @JoinColumn({ name: "promotion_id" })
    promotion!: PromotionPolicy;

    @Column({ name: "product_id" })
    productId!: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column({ type: "decimal", precision: 18, scale: 2, default: 1 })
    quantity!: number;

    @Column({ name: "discount_percentage", type: "decimal", precision: 5, scale: 2, default: 100 })
    discountPercentage!: number;
}
