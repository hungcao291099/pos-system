import { Entity, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity("suppliers")
export class Supplier extends BaseEntity {
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

    @Column({ name: "contact_person", nullable: true })
    contactPerson!: string;

    @Column({ name: "tax_code", nullable: true })
    taxCode!: string;

    @Column({ nullable: true, type: "text" })
    notes!: string;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;
}
