import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

export enum WarehouseType {
    SALES = "SALES",
    GOODS = "GOODS"
}

@Entity("warehouses")
export class Warehouse extends BaseEntity {
    @Column({ unique: true })
    code!: string;

    @Column()
    name!: string;

    @Column({
        type: "varchar",
        length: 20,
        default: WarehouseType.SALES
    })
    type!: WarehouseType;

    @Column({ nullable: true })
    address!: string;

    @Column({ nullable: true })
    description!: string;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;
}
