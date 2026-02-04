import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("product_categories")
export class ProductCategory extends BaseEntity {
    @Column({ unique: true })
    code!: string;

    @Column()
    name!: string;

    @Column({ nullable: true })
    description!: string;

    @Column({ name: "parent_id", nullable: true })
    parentId!: number;

    @ManyToOne("ProductCategory", "children")
    @JoinColumn({ name: "parent_id" })
    parent!: ProductCategory;

    @OneToMany("ProductCategory", "parent")
    children!: ProductCategory[];

    @Column({ name: "sort_order", default: 0 })
    sortOrder!: number;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;
}
