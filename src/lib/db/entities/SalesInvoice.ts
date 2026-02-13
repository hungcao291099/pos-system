import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Warehouse } from "./Warehouse";
import { Customer } from "./Customer";
import type { SalesInvoiceDetail } from "./SalesInvoiceDetail";

export type PaymentMethod = "cash" | "transfer" | "credit";
export type SalesInvoiceStatus = "completed" | "cancelled";

@Entity("sales_invoices")
export class SalesInvoice extends BaseEntity {
    @Column({ name: "invoice_number", unique: true })
    invoiceNumber!: string;

    @Column({ name: "invoice_date", type: "datetime" })
    invoiceDate!: Date;

    @Column({ name: "warehouse_id" })
    warehouseId!: number;

    @ManyToOne(() => Warehouse)
    @JoinColumn({ name: "warehouse_id" })
    warehouse!: Warehouse;

    @Column({ name: "customer_id", type: "integer", nullable: true })
    customerId?: number | null;

    @ManyToOne(() => Customer)
    @JoinColumn({ name: "customer_id" })
    customer!: Customer;

    @Column({ name: "payment_method", type: "varchar", length: 50 })
    paymentMethod!: PaymentMethod;

    @Column({ name: "cash_received", type: "decimal", precision: 18, scale: 2, default: 0 })
    cashReceived!: number;

    @Column({ name: "change_amount", type: "decimal", precision: 18, scale: 2, default: 0 })
    changeAmount!: number;

    @Column({ name: "transfer_code", type: "varchar", nullable: true })
    transferCode?: string | null;

    @Column({ name: "total_amount", type: "decimal", precision: 18, scale: 2, default: 0 })
    totalAmount!: number;

    @Column({ type: "text", nullable: true })
    notes?: string | null;

    @Column({ type: "varchar", length: 50, default: "completed" })
    status!: SalesInvoiceStatus;

    @OneToMany("SalesInvoiceDetail", "salesInvoice")
    details!: SalesInvoiceDetail[];
}
