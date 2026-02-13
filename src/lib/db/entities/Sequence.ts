import { Entity, Column, Unique } from "typeorm";
import { BaseEntity } from "./BaseEntity";

export type SequenceType = "goods_receipt" | "stock_out" | "sales_invoice" | "table_order";

@Entity("sequences")
@Unique(["type", "yearMonth"])
export class Sequence extends BaseEntity {
    @Column({ type: "varchar", length: 50 })
    type!: SequenceType;

    @Column()
    prefix!: string;

    @Column({ name: "year_month" })
    yearMonth!: string;

    @Column({ name: "last_number", default: 0 })
    lastNumber!: number;
}
