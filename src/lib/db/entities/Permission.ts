import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { RolePermission } from "./RolePermission";

@Entity("permissions")
export class Permission extends BaseEntity {
    @Column({ unique: true })
    name!: string;

    @Column({ nullable: true })
    description!: string;

    @Column()
    resource!: string;

    @Column()
    action!: string;

    @OneToMany("RolePermission", "permission")
    rolePermissions!: RolePermission[];
}
