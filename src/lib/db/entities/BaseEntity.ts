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

    @Column({ name: "created_by", nullable: true })
    createdBy!: string;

    @UpdateDateColumn({ name: "modified_at" })
    modifiedAt!: Date;

    @Column({ name: "modified_by", nullable: true })
    modifiedBy!: string;

    @Column({ default: false })
    deleted!: boolean;

    @Column({ name: "deleted_at", nullable: true })
    deletedAt!: Date;

    @Column({ name: "deleted_by", nullable: true })
    deletedBy!: string;
}
