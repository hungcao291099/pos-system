import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { UserRole } from "./UserRole";
import type { RolePermission } from "./RolePermission";
import type { RoleMenu } from "./RoleMenu";

@Entity("roles")
export class Role extends BaseEntity {
    @Column({ unique: true })
    name!: string;

    @Column({ nullable: true })
    description!: string;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @OneToMany("UserRole", "role")
    userRoles!: UserRole[];

    @OneToMany("RolePermission", "role")
    rolePermissions!: RolePermission[];

    @OneToMany("RoleMenu", "role")
    roleMenus!: RoleMenu[];
}
