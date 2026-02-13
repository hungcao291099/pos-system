import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

export type DiningTableStatus = "empty" | "occupied";

@Entity("dining_tables")
export class DiningTable extends BaseEntity {
    @Column()
    name!: string;

    @Column({ type: "varchar", length: 50, default: "Trong nhà" })
    area!: string;

    @Column({ name: "pos_x", type: "float", default: 0 })
    posX!: number;

    @Column({ name: "pos_y", type: "float", default: 0 })
    posY!: number;

    @Column({ type: "float", default: 100 })
    width!: number;

    @Column({ type: "float", default: 100 })
    height!: number;

    @Column({ default: 4 })
    capacity!: number;

    @Column({ type: "varchar", length: 20, default: "empty" })
    status!: DiningTableStatus;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;
}

