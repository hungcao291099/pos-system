import { Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import type { Role } from "./Role";
import type { Permission } from "./Permission";

@Entity("role_permissions")
export class RolePermission {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "role_id" })
    roleId!: number;

    @Column({ name: "permission_id" })
    permissionId!: number;

    @ManyToOne("Role", "rolePermissions", { onDelete: "CASCADE" })
    @JoinColumn({ name: "role_id" })
    role!: Role;

    @ManyToOne("Permission", "rolePermissions", { onDelete: "CASCADE" })
    @JoinColumn({ name: "permission_id" })
    permission!: Permission;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @Column({ name: "created_by", nullable: true })
    createdBy!: string;
}
