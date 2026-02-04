import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import type { UserRole } from "./UserRole";

@Entity("users")
export class User extends BaseEntity {
    @Column({ unique: true })
    username!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    email!: string;

    @Column({ name: "full_name", nullable: true })
    fullName!: string;

    @Column({ name: "is_active", default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    avatar!: string;

    @Column({ name: "last_login", nullable: true })
    lastLogin!: Date;

    @Column({ name: "refresh_token", nullable: true })
    refreshToken!: string;

    @OneToMany("UserRole", "user")
    userRoles!: UserRole[];
}
