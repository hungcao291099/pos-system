import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { RoleMenu } from "./RoleMenu";

@Entity("menus")
export class Menu extends BaseEntity {
    @Column()
    name!: string;

    @Column()
    path!: string;

    @Column({ nullable: true })
    icon!: string;

    @Column({ name: "parent_id", nullable: true })
    parentId!: number;

    @Column({ name: "sort_order", default: 0 })
    sortOrder!: number;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @ManyToOne("Menu", "children")
    @JoinColumn({ name: "parent_id" })
    parent!: Menu;

    @OneToMany("Menu", "parent")
    children!: Menu[];

    @OneToMany("RoleMenu", "menu")
    roleMenus!: RoleMenu[];
}
