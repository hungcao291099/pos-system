import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Role } from "./entities/Role";
import { Menu } from "./entities/Menu";
import { Permission } from "./entities/Permission";
import { UserRole } from "./entities/UserRole";
import { RolePermission } from "./entities/RolePermission";
import { RoleMenu } from "./entities/RoleMenu";
import { Supplier } from "./entities/Supplier";
import { Customer } from "./entities/Customer";
import { Unit } from "./entities/Unit";
import { ProductCategory } from "./entities/ProductCategory";
import { Warehouse } from "./entities/Warehouse";
import { Product } from "./entities/Product";
import { ProductWarehousePrice } from "./entities/ProductWarehousePrice";
import { PriceHistory } from "./entities/PriceHistory";
import { Sequence } from "./entities/Sequence";
import { GoodsReceipt } from "./entities/GoodsReceipt";
import { GoodsReceiptDetail } from "./entities/GoodsReceiptDetail";
import { StockOut } from "./entities/StockOut";
import { StockOutDetail } from "./entities/StockOutDetail";
import { StockPeriod } from "./entities/StockPeriod";
import { StockBalance } from "./entities/StockBalance";
import { SalesInvoice } from "./entities/SalesInvoice";
import { SalesInvoiceDetail } from "./entities/SalesInvoiceDetail";
import { DiningTable } from "./entities/DiningTable";
import { TableOrder } from "./entities/TableOrder";
import { TableOrderItem } from "./entities/TableOrderItem";
import { DiscountPolicy } from "./entities/DiscountPolicy";
import { PromotionPolicy } from "./entities/PromotionPolicy";
import { PromotionBuyItem } from "./entities/PromotionBuyItem";
import { PromotionGetItem } from "./entities/PromotionGetItem";
import path from "path";

export const AppDataSource = new DataSource({
    type: "better-sqlite3",
    database: path.join(process.cwd(), "database.sqlite"),
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV === "development",
    entities: [
        User, Role, Menu, Permission, UserRole, RolePermission, RoleMenu,
        Supplier, Customer, Unit, ProductCategory, Warehouse, Product,
        ProductWarehousePrice, PriceHistory, Sequence,
        GoodsReceipt, GoodsReceiptDetail, StockOut, StockOutDetail,
        StockPeriod, StockBalance, SalesInvoice, SalesInvoiceDetail,
        DiningTable, TableOrder, TableOrderItem,
        DiscountPolicy, PromotionPolicy, PromotionBuyItem, PromotionGetItem
    ],
    migrations: [path.join(process.cwd(), "migrations/*.ts")],
    migrationsTableName: "migrations",
});

let initialized = false;

export async function initializeDatabase() {
    if (!initialized && !AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        initialized = true;
        console.log("Database initialized successfully");
    }
    return AppDataSource;
}
