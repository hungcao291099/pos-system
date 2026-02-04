import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Product, ProductWarehousePrice, PriceHistory } from "@/lib/db/entities";
import {
    getAuthUser,
    requirePermission,
    successResponse,
    badRequestResponse,
    errorResponse,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "product", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const repo = db.getRepository(Product);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const categoryId = searchParams.get("categoryId");
        const all = searchParams.get("all") === "true";

        const queryBuilder = repo
            .createQueryBuilder("product")
            .leftJoinAndSelect("product.unit", "unit")
            .leftJoinAndSelect("product.category", "category")
            .leftJoinAndSelect("product.warehousePrices", "warehousePrices")
            .leftJoinAndSelect("warehousePrices.warehouse", "warehouse")
            .where("product.deleted = :deleted", { deleted: false });

        if (search) {
            queryBuilder.andWhere(
                "(product.code LIKE :search OR product.name LIKE :search OR product.barcode LIKE :search)",
                { search: `%${search}%` }
            );
        }

        if (categoryId) {
            queryBuilder.andWhere("product.category_id = :categoryId", { categoryId: parseInt(categoryId) });
        }

        if (all) {
            const items = await queryBuilder
                .orderBy("product.name", "ASC")
                .getMany();
            return successResponse(items);
        }

        const [items, total] = await queryBuilder
            .orderBy("product.created_at", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        return successResponse({
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error("Get products error:", error);
        return errorResponse("An error occurred while fetching products");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "product", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const {
            code,
            barcode,
            name,
            description,
            unitId,
            categoryId,
            purchasePrice = 0,
            defaultSellPrice = 0,
            minStock = 0,
            maxStock,
            image,
            isActive = true,
            warehousePrices = []
        } = body;

        if (!code || !name || !unitId) {
            return badRequestResponse("Code, name and unit are required");
        }

        const db = await initializeDatabase();
        const productRepo = db.getRepository(Product);
        const priceRepo = db.getRepository(ProductWarehousePrice);

        // Check if code already exists
        const existing = await productRepo.findOne({
            where: { code, deleted: false },
        });
        if (existing) {
            return badRequestResponse("Product code already exists");
        }

        const product = productRepo.create({
            code,
            barcode,
            name,
            description,
            unitId,
            categoryId: categoryId || null,
            purchasePrice,
            defaultSellPrice,
            minStock,
            maxStock,
            image,
            isActive,
            createdBy: authUser?.username || "system",
            modifiedBy: authUser?.username || "system",
        });

        await productRepo.save(product);

        // Save warehouse prices
        if (warehousePrices.length > 0) {
            const prices = warehousePrices.map((wp: { warehouseId: number; sellPrice: number }) =>
                priceRepo.create({
                    productId: product.id,
                    warehouseId: wp.warehouseId,
                    sellPrice: wp.sellPrice,
                    createdBy: authUser?.username || "system",
                    modifiedBy: authUser?.username || "system",
                })
            );
            await priceRepo.save(prices);
        }

        return successResponse(product, "Product created successfully");
    } catch (error) {
        console.error("Create product error:", error);
        return errorResponse("An error occurred while creating product");
    }
}
