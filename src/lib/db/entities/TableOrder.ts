import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { DiningTable } from "./DiningTable";
import type { TableOrderItem } from "./TableOrderItem";

export type TableOrderStatus = "pending" | "preparing" | "completed" | "cancelled";

@Entity("table_orders")
export class TableOrder extends BaseEntity {
    @Column({ name: "order_number", unique: true })
    orderNumber!: string;

    @Column({ name: "table_id" })
    tableId!: number;

    @ManyToOne("DiningTable")
    @JoinColumn({ name: "table_id" })
    table!: DiningTable;

    @Column({ type: "varchar", length: 20, default: "pending" })
    status!: TableOrderStatus;

    @Column({ name: "total_amount", type: "decimal", precision: 18, scale: 2, default: 0 })
    totalAmount!: number;

    @Column({ type: "text", nullable: true })
    notes!: string;

    @OneToMany("TableOrderItem", "tableOrder")
    items!: TableOrderItem[];
}
