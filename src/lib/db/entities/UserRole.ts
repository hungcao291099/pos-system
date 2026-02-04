import { Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import type { User } from "./User";
import type { Role } from "./Role";

@Entity("user_roles")
export class UserRole {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "user_id" })
    userId!: number;

    @Column({ name: "role_id" })
    roleId!: number;

    @ManyToOne("User", "userRoles", { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @ManyToOne("Role", "userRoles", { onDelete: "CASCADE" })
    @JoinColumn({ name: "role_id" })
    role!: Role;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @Column({ name: "created_by", nullable: true })
    createdBy!: string;
}
