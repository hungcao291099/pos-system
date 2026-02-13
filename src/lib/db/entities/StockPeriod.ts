import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { Warehouse } from "./Warehouse";

@Entity("stock_periods")
@Unique(["periodCode", "warehouseId"])
export class StockPeriod extends BaseEntity {
    @Column({ name: "period_code" })
    periodCode!: string;

    @Column({ name: "start_date", type: "datetime" })
    startDate!: Date;

    @Column({ name: "end_date", type: "datetime" })
    endDate!: Date;

    @Column({ name: "warehouse_id" })
    warehouseId!: number;

    @ManyToOne("Warehouse")
    @JoinColumn({ name: "warehouse_id" })
    warehouse!: Warehouse;

    @Column({ name: "is_closed", default: false })
    isClosed!: boolean;

    @Column({ name: "closed_at", type: "datetime", nullable: true })
    closedAt!: Date;

    @Column({ name: "closed_by", nullable: true })
    closedBy!: string;
}
