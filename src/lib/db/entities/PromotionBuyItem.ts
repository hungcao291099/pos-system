import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { PromotionPolicy } from "./PromotionPolicy";
import { Product } from "./Product";

@Entity("promotion_buy_items")
export class PromotionBuyItem extends BaseEntity {
    @Column({ name: "promotion_id" })
    promotionId!: number;

    @ManyToOne("PromotionPolicy", "buyItems")
    @JoinColumn({ name: "promotion_id" })
    promotion!: PromotionPolicy;

    @Column({ name: "product_id" })
    productId!: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column({ type: "decimal", precision: 18, scale: 2, default: 1 })
    quantity!: number;
}
