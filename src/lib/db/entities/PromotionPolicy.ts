import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { PromotionBuyItem } from "./PromotionBuyItem";
import type { PromotionGetItem } from "./PromotionGetItem";

@Entity("promotion_policies")
export class PromotionPolicy extends BaseEntity {
    @Column()
    name!: string;

    @Column({ name: "start_date", type: "datetime" })
    startDate!: Date;

    @Column({ name: "end_date", type: "datetime" })
    endDate!: Date;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @OneToMany("PromotionBuyItem", "promotion")
    buyItems!: PromotionBuyItem[];

    @OneToMany("PromotionGetItem", "promotion")
    getItems!: PromotionGetItem[];
}
