import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { TableOrder } from "./TableOrder";
import type { Product } from "./Product";

export type TableOrderItemStatus = "pending" | "preparing" | "done";

@Entity("table_order_items")
export class TableOrderItem extends BaseEntity {
    @Column({ name: "table_order_id" })
    tableOrderId!: number;

    @ManyToOne("TableOrder", "items", { onDelete: "CASCADE" })
    @JoinColumn({ name: "table_order_id" })
    tableOrder!: TableOrder;

    @Column({ name: "product_id" })
    productId!: number;

    @ManyToOne("Product")
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column({ type: "decimal", precision: 18, scale: 4, default: 0 })
    quantity!: number;

    @Column({ name: "unit_price", type: "decimal", precision: 18, scale: 2, default: 0 })
    unitPrice!: number;

    @Column({ type: "decimal", precision: 18, scale: 2, default: 0 })
    amount!: number;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: TableOrderItemStatus;

    @Column({ type: "text", nullable: true })
    notes!: string;
}
