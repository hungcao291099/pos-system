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
import path from "path";

export const AppDataSource = new DataSource({
    type: "better-sqlite3",
    database: path.join(process.cwd(), "database.sqlite"),
    synchronize: false,
    logging: process.env.NODE_ENV === "development",
    entities: [
        User, Role, Menu, Permission, UserRole, RolePermission, RoleMenu,
        Supplier, Customer, Unit, ProductCategory, Warehouse, Product,
        ProductWarehousePrice, PriceHistory
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
