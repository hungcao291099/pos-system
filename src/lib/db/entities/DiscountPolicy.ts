import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { ProductCategory } from "./ProductCategory";

@Entity("discount_policies")
export class DiscountPolicy extends BaseEntity {
    @Column()
    name!: string;

    @Column({ name: "start_date", type: "datetime" })
    startDate!: Date;

    @Column({ name: "end_date", type: "datetime" })
    endDate!: Date;

    @Column({ name: "category_id", nullable: true })
    categoryId!: number;

    @ManyToOne(() => ProductCategory)
    @JoinColumn({ name: "category_id" })
    category!: ProductCategory;

    @Column({ name: "discount_percentage", type: "decimal", precision: 5, scale: 2, default: 0 })
    discountPercentage!: number;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @Column({ name: "apply_to_all", default: false })
    applyToAll!: boolean;
}
