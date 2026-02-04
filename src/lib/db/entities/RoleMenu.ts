import { Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import type { Role } from "./Role";
import type { Menu } from "./Menu";

@Entity("role_menus")
export class RoleMenu {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "role_id" })
    roleId!: number;

    @Column({ name: "menu_id" })
    menuId!: number;

    @ManyToOne("Role", "roleMenus", { onDelete: "CASCADE" })
    @JoinColumn({ name: "role_id" })
    role!: Role;

    @ManyToOne("Menu", "roleMenus", { onDelete: "CASCADE" })
    @JoinColumn({ name: "menu_id" })
    menu!: Menu;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @Column({ name: "created_by", nullable: true })
    createdBy!: string;
}
