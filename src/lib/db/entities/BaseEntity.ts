import {
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity as TypeORMBaseEntity,
} from "typeorm";

export abstract class BaseEntity extends TypeORMBaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @Column({ name: "created_by", type: "varchar", nullable: true })
    createdBy?: string | null;

    @UpdateDateColumn({ name: "modified_at" })
    modifiedAt!: Date;

    @Column({ name: "modified_by", type: "varchar", nullable: true })
    modifiedBy?: string | null;

    @Column({ default: false })
    deleted!: boolean;

    @Column({ name: "deleted_at", type: "datetime", nullable: true })
    deletedAt?: Date | null;

    @Column({ name: "deleted_by", type: "varchar", nullable: true })
    deletedBy?: string | null;
}
