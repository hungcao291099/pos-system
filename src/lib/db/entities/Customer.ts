import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("customers")
export class Customer extends BaseEntity {
    @Column({ unique: true })
    code!: string;

    @Column()
    name!: string;

    @Column({ nullable: true })
    address!: string;

    @Column({ nullable: true })
    phone!: string;

    @Column({ nullable: true })
    email!: string;

    @Column({ name: "tax_code", nullable: true })
    taxCode!: string;

    @Column({ name: "customer_type", nullable: true })
    customerType!: string;

    @Column({ nullable: true, type: "text" })
    notes!: string;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;
}
