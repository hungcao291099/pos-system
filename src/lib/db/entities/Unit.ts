import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("units")
export class Unit extends BaseEntity {
    @Column({ unique: true })
    code!: string;

    @Column()
    name!: string;

    @Column({ nullable: true })
    description!: string;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;
}
