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

        // Use find with relations instead of createQueryBuilder to avoid databaseName error
        const where: Record<string, unknown> = { deleted: false };
        if (categoryId) {
            where.categoryId = parseInt(categoryId);
        }

        if (all) {
            let items = await repo.find({
                where,
                relations: ["unit", "category", "warehousePrices"],
                order: { name: "ASC" },
            });
            if (search) {
                const s = search.toLowerCase();
                items = items.filter(p =>
                    p.code.toLowerCase().includes(s) ||
                    p.name.toLowerCase().includes(s) ||
                    (p.barcode && p.barcode.toLowerCase().includes(s))
                );
            }
            return successResponse(items);
        }

        // For paginated queries, fetch all matching then paginate in memory
        let items = await repo.find({
            where,
            relations: ["unit", "category", "warehousePrices"],
            order: { createdAt: "DESC" },
        });
        if (search) {
            const s = search.toLowerCase();
            items = items.filter(p =>
                p.code.toLowerCase().includes(s) ||
                p.name.toLowerCase().includes(s) ||
                (p.barcode && p.barcode.toLowerCase().includes(s))
            );
        }
        const total = items.length;
        const paged = items.slice((page - 1) * pageSize, page * pageSize);

        return successResponse({
            items: paged,
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
